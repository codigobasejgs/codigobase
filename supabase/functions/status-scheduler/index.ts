import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const STATUS_ENDPOINT = Deno.env.get('EVOLUTION_STATUS_ENDPOINT') || 'message/sendStatus';
const CRON_SECRET = Deno.env.get('STATUS_CRON_SECRET');
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
function extractJid(contact: any) { return contact?.remoteJid || contact?.jid || contact?.id || contact?.key?.remoteJid; }

async function fetchStatusJids(postId?: string, lockId?: string) {
  const started = Date.now();
  const url = `${EVOLUTION_API_URL.replace(/\/+$/, '')}/chat/findContacts/${EVOLUTION_INSTANCE}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONTACT_TIMEOUT_MS);
  await logEvent(postId, lockId, 'contacts_fetch_started', 'running');
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }, body: JSON.stringify({ where: {} }), signal: controller.signal }).finally(() => clearTimeout(timeout));
  const text = await res.text();
  if (!res.ok) throw new Error(`findContacts ${res.status} ${text.slice(0, 500)}`);
  const contacts = extractContacts(JSON.parse(text));
  const jids = contacts.map(extractJid).filter((jid: string) => typeof jid === 'string' && jid.endsWith('@s.whatsapp.net')).filter((jid: string, index: number, list: string[]) => list.indexOf(jid) === index);
  await logEvent(postId, lockId, 'contacts_fetch_succeeded', 'ok', `${jids.length} contacts`, { count: jids.length }, Date.now() - started);
  return jids;
}

function buildPayload(post: any, statusJidList: string[]) {
  const isVideo = post.media_mime_type?.startsWith('video/');
  return post.media_url
    ? { type: isVideo ? 'video' : 'image', content: post.media_url, caption: post.caption || '', backgroundColor: '#05070D', font: 1, allContacts: true, statusJidList }
    : { type: 'text', content: post.caption || post.title || 'Código Base', caption: '', backgroundColor: '#05070D', font: 1, allContacts: true, statusJidList };
}

async function sendStatus(post: any, lockId: string): Promise<PublishOutcome> {
  const started = Date.now();
  const statusJidList = await fetchStatusJids(post.id, lockId);
  if (!statusJidList.length) throw new Error('No WhatsApp contacts found for statusJidList');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  await logEvent(post.id, lockId, 'evolution_send_started', 'running', `${statusJidList.length} contacts`);
  try {
    const res = await fetch(buildEvolutionUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }, body: JSON.stringify(buildPayload(post, statusJidList)), signal: controller.signal }).finally(() => clearTimeout(timeout));
    const text = await res.text();
    let result: unknown;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 500)}`);
    return { status: 'published', result, duration_ms: Date.now() - started };
  } catch (error: any) {
    clearTimeout(timeout);
    if (error?.name === 'AbortError' || String(error?.message || error).includes('aborted')) return { status: 'published', warning: `Evolution timeout after ${SEND_TIMEOUT_MS}ms; request was treated as posted to avoid false error/duplicate retry.`, duration_ms: Date.now() - started };
    throw error;
  }
}

async function claimPost(id: string, lockId: string) {
  const stale = staleIso();
  const { data, error } = await supabase
    .from('cb_whatsapp_status_posts')
    .update({ status: 'publishing', publish_lock_id: lockId, publishing_started_at: nowIso(), last_attempt_at: nowIso(), error_message: null })
    .eq('id', id)
    .or(`status.eq.scheduled,and(status.in.(publishing,pending_confirmation),publishing_started_at.lt.${stale})`)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  await supabase.from('cb_whatsapp_status_posts').update({ attempt_count: (data.attempt_count || 0) + 1 }).eq('id', id);
  return data;
}

function nextSchedule(post: any) {
  const current = new Date(post.scheduled_at);
  if (post.repeat_type === 'daily') return new Date(current.getTime() + 24 * 60 * 60 * 1000).toISOString();
  if (post.repeat_type === 'weekly') return new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

async function ensureNextRepeat(post: any) {
  const next = nextSchedule(post);
  if (!next) return null;
  const { data: existing, error: findError } = await supabase.from('cb_whatsapp_status_posts').select('id').eq('media_path', post.media_path).eq('scheduled_at', next).maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;
  const { id, published_at, last_attempt_at, error_message, created_at, updated_at, publish_lock_id, publishing_started_at, attempt_count, last_success_at, last_evolution_status, evolution_response, ...clone } = post;
  const { data, error } = await supabase.from('cb_whatsapp_status_posts').insert({ ...clone, scheduled_at: next, status: 'scheduled' }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function finalize(post: any, lockId: string, outcome: PublishOutcome) {
  const update: any = { status: outcome.status, updated_at: nowIso(), last_evolution_status: outcome.status, evolution_response: outcome.result || { warning: outcome.warning }, error_message: outcome.warning || null };
  if (outcome.status === 'published') { update.published_at = nowIso(); update.last_success_at = update.published_at; update.error_message = null; }
  const { error } = await supabase.from('cb_whatsapp_status_posts').update(update).eq('id', post.id).eq('publish_lock_id', lockId);
  if (error) throw new Error(error.message);
  const nextId = await ensureNextRepeat(post);
  await logEvent(post.id, lockId, outcome.status === 'published' ? 'finalized_published' : 'timeout_pending_confirmation', outcome.status, nextId ? `next ${nextId}` : outcome.warning, outcome.result, outcome.duration_ms);
}

async function processPost(post: any) {
  const lockId = crypto.randomUUID();
  try {
    await logEvent(post.id, lockId, 'claim_started', 'running');
    const claimed = await claimPost(post.id, lockId);
    if (!claimed) return { id: post.id, ok: true, skipped: 'locked_or_not_due' };
    const outcome = await sendStatus(claimed, lockId);
    await finalize(claimed, lockId, outcome);
    return { id: post.id, ok: true, status: outcome.status, warning: outcome.warning };
  } catch (err) {
    const message = String(err?.message || err);
    await supabase.from('cb_whatsapp_status_posts').update({ status: 'error', error_message: message.slice(0, 1000), updated_at: nowIso(), last_evolution_status: 'error' }).eq('id', post.id).eq('publish_lock_id', lockId);
    await logEvent(post.id, lockId, 'finalized_error', 'error', message.slice(0, 1000));
    return { id: post.id, ok: false, error: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (CRON_SECRET && url.searchParams.get('secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, { status: 401 });
    const stale = staleIso();
    const due = nowIso();
    const { data: posts, error } = await supabase
      .from('cb_whatsapp_status_posts')
      .select('*')
      .or(`and(status.eq.scheduled,scheduled_at.lte.${due}),and(status.in.(publishing,pending_confirmation),publishing_started_at.lt.${stale})`)
      .order('scheduled_at')
      .limit(3);
    if (error) throw new Error(error.message);
    const results = [];
    for (const post of posts || []) results.push(await processPost(post));
    return json({ ok: true, count: results.length, results });
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
});
