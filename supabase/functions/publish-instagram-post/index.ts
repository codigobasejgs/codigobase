import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_GRAPH_VERSION = Deno.env.get('META_GRAPH_VERSION') || 'v23.0';
const META_APP_ID = Deno.env.get('META_APP_ID') || '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || '';
const REFRESH_DAYS = Number(Deno.env.get('INSTAGRAM_TOKEN_REFRESH_DAYS') || 10);
const STALE_MINUTES = Number(Deno.env.get('INSTAGRAM_PUBLISHING_STALE_MINUTES') || 15);
const POLL_ATTEMPTS = Number(Deno.env.get('INSTAGRAM_CONTAINER_POLL_ATTEMPTS') || 8);
const POLL_DELAY_MS = Number(Deno.env.get('INSTAGRAM_CONTAINER_POLL_DELAY_MS') || 2500);
const GRAPH_TIMEOUT_MS = Number(Deno.env.get('INSTAGRAM_GRAPH_TIMEOUT_MS') || 90000);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PublishOutcome = { status: 'published' | 'pending_confirmation'; result?: unknown; warning?: string; duration_ms: number; mediaId?: string; permalink?: string };

function nowIso() { return new Date().toISOString(); }
function staleIso() { return new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString(); }
function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function graphBase() { return `https://graph.facebook.com/${META_GRAPH_VERSION}`; }
function sleep(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function isVideo(media: any) { return media?.media_kind === 'video' || media?.media_mime_type?.startsWith('video/'); }
function isTimeoutLike(error: any) { return error?.name === 'AbortError' || String(error?.message || error).includes('aborted') || String(error?.message || error).includes('timeout'); }

async function logEvent(postId: string | undefined, accountId: string | undefined, lockId: string | undefined, eventType: string, status: string, message?: string, endpoint?: string, response?: unknown, duration_ms?: number) {
  console.log(JSON.stringify({ postId, accountId, lockId, eventType, status, message, endpoint, duration_ms }));
  if (!postId) return;
  await supabase.from('cb_instagram_publish_logs').insert({ post_id: postId, account_id: accountId, lock_id: lockId, event_type: eventType, status, message, graph_endpoint: endpoint || null, graph_response: response || null, duration_ms: duration_ms || null });
}

async function graphRequest(path: string, token: string, params: Record<string, any> = {}, method = 'POST') {
  const started = Date.now();
  const url = new URL(`${graphBase()}${path}`);
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    body.set(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  body.set('access_token', token);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GRAPH_TIMEOUT_MS);
  const res = await fetch(url.toString(), { method, body: method === 'POST' ? body : undefined, signal: controller.signal }).finally(() => clearTimeout(timeout));
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data?.error) {
    const err: any = new Error(data?.error?.message || `${res.status} ${text.slice(0, 500)}`);
    err.response = data;
    err.status = res.status;
    err.endpoint = path;
    err.duration_ms = Date.now() - started;
    throw err;
  }
  return { data, endpoint: path, duration_ms: Date.now() - started };
}

async function graphGet(path: string, token: string, params: Record<string, any> = {}) {
  const started = Date.now();
  const url = new URL(`${graphBase()}${path}`);
  Object.entries({ ...params, access_token: token }).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    const err: any = new Error(data?.error?.message || `${res.status}`);
    err.response = data;
    err.status = res.status;
    err.endpoint = path;
    err.duration_ms = Date.now() - started;
    throw err;
  }
  return { data, endpoint: path, duration_ms: Date.now() - started };
}

async function refreshAccountTokenIfNeeded(account: any, postId: string, lockId: string) {
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const refreshAt = Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000;
  if (expiresAt && expiresAt > refreshAt) return account;
  if (!META_APP_ID || !META_APP_SECRET) return account;
  const url = new URL(`${graphBase()}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', account.access_token);
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    await logEvent(postId, account.id, lockId, 'token_refresh_skipped', 'warn', data?.error?.message || `refresh ${res.status}`, '/oauth/access_token', data);
    return account;
  }
  const token = data.access_token || account.access_token;
  const expiration = new Date(Date.now() + Number(data.expires_in || 60 * 24 * 60 * 60) * 1000).toISOString();
  await supabase.from('cb_instagram_accounts').update({ access_token: token, token_expires_at: expiration, token_last_refreshed_at: nowIso(), is_active: true, last_error: null, updated_at: nowIso() }).eq('id', account.id);
  await logEvent(postId, account.id, lockId, 'token_refreshed_before_publish', 'ok', `expires ${expiration}`, '/oauth/access_token', { expires_at: expiration });
  return { ...account, access_token: token, token_expires_at: expiration, is_active: true, last_error: null };
}

async function pollContainer(containerId: string, token: string) {
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    const { data } = await graphGet(`/${containerId}`, token, { fields: 'status_code,status' });
    const code = String(data?.status_code || '').toUpperCase();
    if (code === 'FINISHED' || code === 'PUBLISHED') return data;
    if (code === 'ERROR' || code === 'EXPIRED') throw new Error(`Instagram container ${containerId} ${code}: ${data?.status || ''}`);
    await sleep(POLL_DELAY_MS);
  }
  throw new Error(`Instagram container ${containerId} ainda processando. Tente novamente em alguns minutos.`);
}

function validatePost(post: any, media: any[]) {
  if (!media.length) throw new Error('Adicione mídia antes de publicar');
  if (post.post_type === 'carousel' && (media.length < 2 || media.length > 10)) throw new Error('Carrossel precisa de 2 a 10 mídias');
  if (post.post_type !== 'carousel' && media.length !== 1) throw new Error('Este tipo de post aceita apenas 1 mídia');
  if (post.post_type === 'feed_image' && isVideo(media[0])) throw new Error('Feed imagem precisa de imagem');
  if (['feed_video','reel'].includes(post.post_type) && !isVideo(media[0])) throw new Error('Este tipo precisa de vídeo MP4');
}

async function createSingleContainer(post: any, account: any, media: any, lockId: string) {
  const params: Record<string, any> = {};
  if (post.post_type === 'feed_image') {
    params.image_url = media.media_url;
    params.caption = post.caption || '';
  } else if (post.post_type === 'feed_video') {
    params.media_type = 'VIDEO';
    params.video_url = media.media_url;
    params.caption = post.caption || '';
  } else if (post.post_type === 'reel') {
    params.media_type = 'REELS';
    params.video_url = media.media_url;
    params.caption = post.caption || '';
    params.share_to_feed = true;
  } else if (post.post_type === 'story') {
    params.media_type = 'STORIES';
    if (isVideo(media)) params.video_url = media.media_url; else params.image_url = media.media_url;
  }
  const res = await graphRequest(`/${account.instagram_user_id}/media`, account.access_token, params);
  const containerId = res.data?.id;
  if (!containerId) throw new Error('Instagram não retornou container id');
  await supabase.from('cb_instagram_posts').update({ ig_container_id: containerId, status: 'container_created', graph_response: res.data, updated_at: nowIso() }).eq('id', post.id).eq('publish_lock_id', lockId);
  await logEvent(post.id, account.id, lockId, 'container_created', 'ok', containerId, res.endpoint, res.data, res.duration_ms);
  if (isVideo(media) || ['feed_video','reel'].includes(post.post_type)) await pollContainer(containerId, account.access_token);
  return containerId;
}

async function createCarouselContainer(post: any, account: any, media: any[], lockId: string) {
  const childIds: string[] = [];
  for (const item of media) {
    const params: Record<string, any> = { is_carousel_item: true };
    if (isVideo(item)) { params.media_type = 'VIDEO'; params.video_url = item.media_url; } else { params.image_url = item.media_url; }
    const child = await graphRequest(`/${account.instagram_user_id}/media`, account.access_token, params);
    const childId = child.data?.id;
    if (!childId) throw new Error('Instagram não retornou child container id');
    childIds.push(childId);
    await supabase.from('cb_instagram_post_media').update({ ig_child_container_id: childId, graph_response: child.data, updated_at: nowIso() }).eq('id', item.id);
    await logEvent(post.id, account.id, lockId, 'carousel_child_created', 'ok', childId, child.endpoint, child.data, child.duration_ms);
    if (isVideo(item)) await pollContainer(childId, account.access_token);
  }
  const parent = await graphRequest(`/${account.instagram_user_id}/media`, account.access_token, { media_type: 'CAROUSEL', children: childIds, caption: post.caption || '' });
  const containerId = parent.data?.id;
  if (!containerId) throw new Error('Instagram não retornou carousel container id');
  await supabase.from('cb_instagram_posts').update({ ig_container_id: containerId, status: 'container_created', graph_response: parent.data, updated_at: nowIso() }).eq('id', post.id).eq('publish_lock_id', lockId);
  await logEvent(post.id, account.id, lockId, 'carousel_container_created', 'ok', containerId, parent.endpoint, parent.data, parent.duration_ms);
  return containerId;
}

async function publishContainer(post: any, account: any, containerId: string, lockId: string) {
  const res = await graphRequest(`/${account.instagram_user_id}/media_publish`, account.access_token, { creation_id: containerId });
  const mediaId = res.data?.id;
  if (!mediaId) throw new Error('Instagram não retornou media id');
  let permalink: string | undefined;
  try { permalink = (await graphGet(`/${mediaId}`, account.access_token, { fields: 'permalink' })).data?.permalink; } catch (_) {}
  await logEvent(post.id, account.id, lockId, 'media_published', 'ok', mediaId, res.endpoint, res.data, res.duration_ms);
  return { mediaId, permalink, response: res.data };
}

async function claimPost(id: string, lockId: string) {
  const stale = staleIso();
  const { data, error } = await supabase
    .from('cb_instagram_posts')
    .update({ status: 'publishing', publish_lock_id: lockId, publishing_started_at: nowIso(), last_attempt_at: nowIso(), error_message: null, updated_at: nowIso() })
    .eq('id', id)
    .or(`status.in.(scheduled,error,container_created),and(status.eq.publishing,publishing_started_at.lt.${stale})`)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  await supabase.from('cb_instagram_posts').update({ attempt_count: (data.attempt_count || 0) + 1 }).eq('id', id);
  return data;
}

async function sendInstagram(post: any, lockId: string): Promise<PublishOutcome> {
  const started = Date.now();
  const { data: accountRow, error: accountError } = await supabase.from('cb_instagram_accounts').select('*').eq('id', post.account_id).single();
  if (accountError || !accountRow) throw new Error(accountError?.message || 'Instagram account not found');
  if (!accountRow.is_active) throw new Error(accountRow.last_error || 'Instagram account inactive');
  const account = await refreshAccountTokenIfNeeded(accountRow, post.id, lockId);
  const { data: media, error: mediaError } = await supabase.from('cb_instagram_post_media').select('*').eq('post_id', post.id).order('position');
  if (mediaError) throw new Error(mediaError.message);
  validatePost(post, media || []);
  await logEvent(post.id, account.id, lockId, 'publish_started', 'running', post.post_type);
  try {
    const containerId = post.ig_container_id || (post.post_type === 'carousel' ? await createCarouselContainer(post, account, media || [], lockId) : await createSingleContainer(post, account, (media || [])[0], lockId));
    const published = await publishContainer(post, account, containerId, lockId);
    return { status: 'published', mediaId: published.mediaId, permalink: published.permalink, result: published.response, duration_ms: Date.now() - started };
  } catch (error: any) {
    if (isTimeoutLike(error) && post.ig_container_id) return { status: 'pending_confirmation', warning: 'Instagram Graph timeout após container criado. Confira o Instagram antes de reenviar para evitar duplicidade.', result: error.response || null, duration_ms: Date.now() - started };
    throw error;
  }
}

async function finalize(post: any, lockId: string, outcome: PublishOutcome) {
  const update: any = { status: outcome.status, updated_at: nowIso(), graph_response: outcome.result || { warning: outcome.warning }, error_message: outcome.warning || null };
  if (outcome.status === 'published') { update.published_at = nowIso(); update.last_success_at = update.published_at; update.ig_media_id = outcome.mediaId; update.permalink = outcome.permalink || null; update.error_message = null; }
  const { error } = await supabase.from('cb_instagram_posts').update(update).eq('id', post.id).eq('publish_lock_id', lockId);
  if (error) throw new Error(error.message);
  await logEvent(post.id, post.account_id, lockId, outcome.status === 'published' ? 'finalized_published' : 'pending_confirmation', outcome.status, outcome.warning || outcome.mediaId, undefined, outcome.result, outcome.duration_ms);
}

async function fail(postId: string | undefined, accountId: string | undefined, lockId: string | undefined, error: any) {
  const message = String(error?.message || error);
  if (postId) await supabase.from('cb_instagram_posts').update({ status: 'error', error_message: message.slice(0, 1000), graph_response: error?.response || null, updated_at: nowIso() }).eq('id', postId).eq('publish_lock_id', lockId);
  if (accountId && /token|permission|OAuth|access/i.test(message)) await supabase.from('cb_instagram_accounts').update({ is_active: false, last_error: message.slice(0, 1000), updated_at: nowIso() }).eq('id', accountId);
  await logEvent(postId, accountId, lockId, 'finalized_error', 'error', message.slice(0, 1000), error?.endpoint, error?.response, error?.duration_ms);
  return message;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  let id: string | undefined;
  let lockId: string | undefined;
  let accountId: string | undefined;
  try {
    const body = await req.json();
    id = body.id;
    if (!id) throw new Error('id required');
    lockId = crypto.randomUUID();
    await logEvent(id, undefined, lockId, 'claim_started', 'running');
    const post = await claimPost(id, lockId);
    if (!post) return json({ ok: true, skipped: true, status: 'locked_or_not_publishable' });
    accountId = post.account_id;
    const outcome = await sendInstagram(post, lockId);
    await finalize(post, lockId, outcome);
    return json({ ok: true, status: outcome.status, mediaId: outcome.mediaId, permalink: outcome.permalink, warning: outcome.warning, result: outcome.result });
  } catch (error) {
    const message = await fail(id, accountId, lockId, error);
    return json({ ok: false, status: 'error', error: message }, { status: 500 });
  }
});
