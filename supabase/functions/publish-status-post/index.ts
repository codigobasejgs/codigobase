import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const STATUS_ENDPOINT = Deno.env.get('EVOLUTION_STATUS_ENDPOINT') || 'message/sendStatus';
const SEND_TIMEOUT_MS = Number(Deno.env.get('EVOLUTION_STATUS_TIMEOUT_MS') || 90000);
const CONTACT_TIMEOUT_MS = Number(Deno.env.get('EVOLUTION_CONTACT_TIMEOUT_MS') || 20000);
const STALE_MINUTES = Number(Deno.env.get('STATUS_PUBLISHING_STALE_MINUTES') || 10);

type PublishOutcome = { status: 'published' | 'pending_confirmation'; result?: unknown; warning?: string; duration_ms: number };

function nowIso() { return new Date().toISOString(); }
function staleIso() { return new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString(); }
function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function cleanEndpoint(endpoint: string) { return endpoint.replace(/^.*(?:Program Files\/Git|Git)[\\/]/, '').replace(/^\/+/, ''); }
function buildEvolutionUrl() { return `${EVOLUTION_API_URL.replace(/\/+$/, '')}/${cleanEndpoint(STATUS_ENDPOINT)}/${EVOLUTION_INSTANCE}`; }

async function logEvent(postId: string | undefined, lockId: string | undefined, eventType: string, status: string, message?: string, response?: unknown, duration_ms?: number) {
  console.log(JSON.stringify({ postId, lockId, eventType, status, message, duration_ms }));
  if (!postId) return;
  await supabase.from('cb_whatsapp_status_publish_logs').insert({ post_id: postId, lock_id: lockId, event_type: eventType, status, message, evolution_response: response || null, duration_ms: duration_ms || null });
}

function extractContacts(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.contacts)) return payload.contacts;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.response)) return payload.response;
  return [];
}

function extractJid(contact: any) {
  return contact?.remoteJid || contact?.jid || contact?.id || contact?.key?.remoteJid;
}

async function fetchStatusJids(postId?: string, lockId?: string) {
  const started = Date.now();
  const url = `${EVOLUTION_API_URL.replace(/\/+$/, '')}/chat/findContacts/${EVOLUTION_INSTANCE}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);
  await logEvent(postId, lockId, 'contacts_fetch_started', 'running');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ where: {} }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  const text = await res.text();
  if (!res.ok) throw new Error(`findContacts ${res.status} ${text.slice(0, 500)}`);
  const contacts = extractContacts(JSON.parse(text));
  const jids = contacts
    .map(extractJid)
    .filter((jid: string) => typeof jid === 'string' && jid.endsWith('@s.whatsapp.net'))
    .filter((jid: string, index: number, list: string[]) => list.indexOf(jid) === index);
  await logEvent(postId, lockId, 'contacts_fetch_succeeded', 'ok', `${jids.length} contacts`, { count: jids.length }, Date.now() - started);
  return jids;
}

function buildPayload(post: any, statusJidList: string[]) {
  const isVideo = post.media_mime_type?.startsWith('video/');
  if (post.media_url) {
    return { type: isVideo ? 'video' : 'image', content: post.media_url, caption: post.caption || '', backgroundColor: '#05070D', font: 1, allContacts: true, statusJidList };
  }
  return { type: 'text', content: post.caption || post.title || 'Código Base', caption: '', backgroundColor: '#05070D', font: 1, allContacts: true, statusJidList };
}

async function sendStatus(post: any, lockId: string): Promise<PublishOutcome> {
  const started = Date.now();
  const statusJidList = await fetchStatusJids(post.id, lockId);
  if (!statusJidList.length) throw new Error('No WhatsApp contacts found for statusJidList');
  const payload = buildPayload(post, statusJidList);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  await logEvent(post.id, lockId, 'evolution_send_started', 'running', `${statusJidList.length} contacts`);
  try {
    const res = await fetch(buildEvolutionUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }, body: JSON.stringify(payload), signal: controller.signal }).finally(() => clearTimeout(timeout));
    const text = await res.text();
    let result: unknown;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 500)}`);
    return { status: 'published', result, duration_ms: Date.now() - started };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error?.name === 'AbortError' || String(error?.message || error).includes('aborted')) {
      return { status: 'pending_confirmation', warning: `Evolution timeout after ${SEND_TIMEOUT_MS}ms; request may have been accepted. Not retrying automatically.`, duration_ms: Date.now() - started };
    }
    throw error;
  }
}

async function claimPost(id: string, lockId: string) {
  const stale = staleIso();
  const claim = { status: 'publishing', publish_lock_id: lockId, publishing_started_at: nowIso(), last_attempt_at: nowIso(), error_message: null };
  const { data, error } = await supabase
    .from('cb_whatsapp_status_posts')
    .update(claim)
    .eq('id', id)
    .or(`status.in.(scheduled,error),and(status.in.(publishing,pending_confirmation),publishing_started_at.lt.${stale})`)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  await supabase.from('cb_whatsapp_status_posts').update({ attempt_count: (data.attempt_count || 0) + 1 }).eq('id', id);
  return data;
}

async function finalize(post: any, lockId: string, outcome: PublishOutcome) {
  const update: any = { status: outcome.status, updated_at: nowIso(), last_evolution_status: outcome.status, evolution_response: outcome.result || { warning: outcome.warning }, error_message: outcome.warning || null };
  if (outcome.status === 'published') {
    update.published_at = nowIso();
    update.last_success_at = update.published_at;
    update.error_message = null;
  }
  const { error } = await supabase.from('cb_whatsapp_status_posts').update(update).eq('id', post.id).eq('publish_lock_id', lockId);
  if (error) throw new Error(error.message);
  await logEvent(post.id, lockId, outcome.status === 'published' ? 'finalized_published' : 'timeout_pending_confirmation', outcome.status, outcome.warning, outcome.result, outcome.duration_ms);
}

async function fail(postId: string | undefined, lockId: string | undefined, error: unknown) {
  const message = String((error as any)?.message || error);
  if (postId) await supabase.from('cb_whatsapp_status_posts').update({ status: 'error', error_message: message.slice(0, 1000), updated_at: nowIso(), last_evolution_status: 'error' }).eq('id', postId);
  await logEvent(postId, lockId, 'finalized_error', 'error', message.slice(0, 1000));
  return message;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let id: string | undefined;
  let lockId: string | undefined;
  try {
    const body = await req.json();
    id = body.id;
    if (!id) throw new Error('id required');
    lockId = crypto.randomUUID();
    await logEvent(id, lockId, 'claim_started', 'running');
    const post = await claimPost(id, lockId);
    if (!post) return json({ ok: true, skipped: true, status: 'locked_or_not_publishable' });
    const outcome = await sendStatus(post, lockId);
    await finalize(post, lockId, outcome);
    return json({ ok: true, status: outcome.status, result: outcome.result, warning: outcome.warning });
  } catch (error) {
    const message = await fail(id, lockId, error);
    return json({ ok: false, status: 'error', error: message }, { status: 500 });
  }
});
