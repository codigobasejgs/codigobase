import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); return data.user; }
async function logEvent(draftId: string, eventType: string, status: string, message?: string, response?: unknown) { await supabase.from('cb_ai_creative_logs').insert({ draft_id: draftId, event_type: eventType, status, message, response: response || null }); }

async function createWhatsApp(draft: any, assets: any[], scheduledAt: string, userId: string) {
  const created: string[] = [];
  for (const asset of assets) {
    const { data, error } = await supabase.from('cb_whatsapp_status_posts').insert({ title: draft.title, caption: draft.caption, media_url: asset.media_url, media_path: asset.media_path, media_mime_type: asset.mime_type, scheduled_at: scheduledAt, repeat_type: 'once', campaign: draft.theme_category, timezone: 'America/Sao_Paulo', created_by: userId }).select('id').single();
    if (error) throw new Error(error.message);
    created.push(data.id);
  }
  return created;
}
async function createInstagram(draft: any, assets: any[], scheduledAt: string, userId: string) {
  const { data: account, error: accountError } = await supabase.from('cb_instagram_accounts').select('id').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (accountError) throw new Error(accountError.message);
  if (!account) throw new Error('Nenhuma conta Instagram ativa conectada');
  const postType = draft.draft_type === 'carousel' ? 'carousel' : 'story';
  const { data: post, error } = await supabase.from('cb_instagram_posts').insert({ account_id: account.id, title: draft.title, caption: draft.caption, post_type: postType, scheduled_at: scheduledAt, campaign: draft.theme_category, timezone: 'America/Sao_Paulo', created_by: userId }).select('id').single();
  if (error) throw new Error(error.message);
  const rows = assets.map((asset: any, index: number) => ({ post_id: post.id, position: index, media_url: asset.media_url, media_path: asset.media_path, media_mime_type: asset.mime_type, media_kind: 'image' }));
  const { error: mediaError } = await supabase.from('cb_instagram_post_media').insert(rows);
  if (mediaError) throw new Error(mediaError.message);
  return [post.id];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(req.headers.get('Authorization') || '');
    const { draftId, targets, scheduledAt, publishNow } = await req.json();
    if (!draftId) throw new Error('draftId required');
    const scheduleIso = scheduledAt ? new Date(scheduledAt).toISOString() : new Date(Date.now() + (publishNow ? 0 : 10 * 60 * 1000)).toISOString();
    const { data: draft, error: draftError } = await supabase.from('cb_ai_creative_drafts').select('*').eq('id', draftId).single();
    if (draftError || !draft) throw new Error(draftError?.message || 'Draft não encontrado');
    if (!['generated','approved'].includes(draft.status)) throw new Error('Draft não está pronto para agendar');
    const { data: assets, error: assetsError } = await supabase.from('cb_ai_creative_assets').select('*').eq('draft_id', draftId).order('position');
    if (assetsError) throw new Error(assetsError.message);
    if (!assets?.length) throw new Error('Draft sem imagens');
    const desiredTargets = Array.isArray(targets) && targets.length ? targets : draft.platform_targets;
    const result: any = {};
    if (desiredTargets.includes('whatsapp')) result.whatsapp = await createWhatsApp(draft, draft.draft_type === 'carousel' ? assets.slice(0, 3) : assets, scheduleIso, user.id);
    if (desiredTargets.includes('instagram')) result.instagram = await createInstagram(draft, assets.slice(0, 10), scheduleIso, user.id);
    const { error: updateError } = await supabase.from('cb_ai_creative_drafts').update({ status: 'scheduled', approved_by: user.id, scheduled_at: scheduleIso, updated_at: new Date().toISOString() }).eq('id', draftId);
    if (updateError) throw new Error(updateError.message);
    await logEvent(draftId, 'scheduled', 'ok', scheduleIso, result);
    return json({ ok: true, scheduledAt: scheduleIso, result });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
