import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { CANONICAL_OPT_OUT_NOTICE, hasCanonicalOptOutNotice } from '../_shared/outboundSafety.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function requireAdmin(req: Request) {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return { error: json({ ok: false, error: 'unauthorized' }, 401) };
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { error: json({ ok: false, error: 'unauthorized' }, 401) };
  if (data.user.app_metadata?.role !== 'admin') return { error: json({ ok: false, error: 'forbidden' }, 403) };
  return { user: data.user };
}

async function log(entry: Record<string, unknown>) {
  await admin.from('cb_outbound_send_logs').insert(entry);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  let draftId = '';
  try {
    ({ draftId } = await req.json());
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }
  if (!draftId) return json({ ok: false, error: 'draftId_required' }, 400);

  const { data: draft, error: draftError } = await admin
    .from('cb_outbound_message_drafts')
    .select('*, prospect:cb_outbound_prospects(*)')
    .eq('id', draftId)
    .single();
  if (draftError || !draft) return json({ ok: false, error: 'draft_not_found' }, 404);

  const prospect = draft.prospect;
  if (draft.status !== 'approved') return json({ ok: false, error: 'draft_not_approved' }, 409);
  if (!prospect || !/^\+[1-9]\d{9,14}$/.test(prospect.phone_e164)) return json({ ok: false, error: 'invalid_prospect_phone' }, 422);
  if (!hasCanonicalOptOutNotice(draft.body)) return json({ ok: false, error: `missing_opt_out_notice: ${CANONICAL_OPT_OUT_NOTICE}` }, 422);

  const { data: suppression, error: suppressionError } = await admin.from('cb_whatsapp_suppressions').select('id').eq('phone_e164', prospect.phone_e164).maybeSingle();
  if (suppressionError) return json({ ok: false, error: 'suppression_check_failed' }, 503);
  if (suppression || ['opted_out', 'blocked', 'invalid'].includes(prospect.status)) {
    const { error: blockError } = await admin.from('cb_outbound_message_drafts').update({ status: 'blocked', error_message: 'Contato suprimido', updated_at: new Date().toISOString() }).eq('id', draft.id).eq('status', 'approved');
    if (blockError) return json({ ok: false, error: 'suppression_persistence_failed' }, 500);
    await log({ prospect_id: prospect.id, draft_id: draft.id, event_type: 'blocked', status: 'blocked', message: 'Contato suprimido' });
    return json({ ok: false, error: 'contact_suppressed' }, 409);
  }

  const lockId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
  const { data: claimRows, error: claimError } = await authClient.rpc('cb_claim_outbound_draft', {
    target_draft_id: draft.id,
    target_user_id: auth.user!.id,
    target_lock_id: lockId,
  });
  if (claimError) return json({ ok: false, error: claimError.message }, claimError.code === '42501' ? 403 : 500);
  const claimed = claimRows?.[0];
  if (!claimed) return json({ ok: false, error: 'draft_not_eligible_or_suppressed' }, 409);

  const claimedBody = String(claimed.body || '');
  const claimedPhone = String(claimed.phone_e164 || '');
  if (!/^\+[1-9]\d{9,14}$/.test(claimedPhone) || !hasCanonicalOptOutNotice(claimedBody)) {
    const { error: stateError } = await admin.from('cb_outbound_message_drafts').update({ status: 'error', error_message: 'Snapshot do claim inválido', updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId).eq('status', 'sending');
    return json({ ok: false, error: stateError ? 'invalid_claim_persistence_failed' : 'invalid_claim_snapshot' }, 500);
  }

  await log({ prospect_id: prospect.id, draft_id: draft.id, lock_id: lockId, event_type: 'send_started', status: 'sending' });
  const startedMs = Date.now();

  try {
    const { data: suppressionAfterClaim, error: suppressionAfterClaimError } = await admin.from('cb_whatsapp_suppressions').select('id').eq('phone_e164', claimedPhone).maybeSingle();
    if (suppressionAfterClaimError) {
      const { error: stateError } = await admin.from('cb_outbound_message_drafts').update({ status: 'error', error_message: 'Falha ao verificar supressão após claim; envio não iniciado', updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId).eq('status', 'sending');
      return json({ ok: false, error: stateError ? 'suppression_check_persistence_failed' : 'suppression_check_failed' }, 503);
    }
    if (suppressionAfterClaim) {
      const { error: blockError } = await admin.from('cb_outbound_message_drafts').update({ status: 'blocked', error_message: 'Contato suprimido antes do envio', updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId);
      if (blockError) return json({ ok: false, error: 'suppression_persistence_failed' }, 500);
      await log({ prospect_id: prospect.id, draft_id: draft.id, lock_id: lockId, event_type: 'blocked_after_claim', status: 'blocked' });
      return json({ ok: false, error: 'contact_suppressed' }, 409);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let response: Response;
    try {
      response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
        body: JSON.stringify({ number: claimedPhone.slice(1), text: claimedBody, idempotencyKey: String(claimed.idempotency_key) }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawResponse = await response.text();
    let evolutionResponse: unknown = rawResponse;
    try { evolutionResponse = JSON.parse(rawResponse); } catch { /* preserve text */ }

    if (!response.ok) {
      await admin.from('cb_outbound_message_drafts').update({ status: 'error', error_message: rawResponse.slice(0, 1000), evolution_response: evolutionResponse, updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId);
      await log({ prospect_id: prospect.id, draft_id: draft.id, lock_id: lockId, event_type: 'send_failed', status: 'error', message: rawResponse.slice(0, 1000), duration_ms: Date.now() - startedMs });
      return json({ ok: false, error: 'evolution_rejected' }, 502);
    }

    const result = evolutionResponse as any;
    const evolutionMessageId = result?.key?.id || result?.message?.key?.id || result?.id || null;
    const { data: finalized, error: finalizeError } = await admin.rpc('cb_finalize_outbound_send', {
      target_draft_id: draft.id,
      target_lock_id: lockId,
      target_evolution_message_id: evolutionMessageId,
      target_evolution_response: evolutionResponse,
      target_duration_ms: Date.now() - startedMs,
    });
    if (finalizeError || !finalized) {
      await admin.from('cb_outbound_message_drafts').update({ status: 'pending_confirmation', error_message: 'Evolution aceitou, mas persistência final não foi confirmada', evolution_response: evolutionResponse, updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId).eq('status', 'sending');
      return json({ ok: false, error: 'pending_confirmation' }, 500);
    }
    return json({ ok: true, draftId: draft.id, status: 'sent', evolutionMessageId });
  } catch (error) {
    const message = String((error as Error)?.message || error);
    const { error: pendingError } = await admin.from('cb_outbound_message_drafts').update({ status: 'pending_confirmation', error_message: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq('id', draft.id).eq('send_lock_id', lockId).eq('status', 'sending');
    await log({ prospect_id: prospect.id, draft_id: draft.id, lock_id: lockId, event_type: 'send_transport_uncertain', status: 'pending_confirmation', message: message.slice(0, 1000), duration_ms: Date.now() - startedMs });
    return json({ ok: false, error: pendingError ? 'pending_confirmation_persistence_failed' : 'pending_confirmation' }, 504);
  }
});
