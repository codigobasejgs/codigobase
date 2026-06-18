import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID') || '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || '';
const META_GRAPH_VERSION = Deno.env.get('META_GRAPH_VERSION') || 'v23.0';
const CRON_SECRET = Deno.env.get('INSTAGRAM_CRON_SECRET');
const REFRESH_DAYS = Number(Deno.env.get('INSTAGRAM_TOKEN_REFRESH_DAYS') || 10);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function refreshBeforeIso() { return new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000).toISOString(); }
function expiresAt(expiresIn: number) { return new Date(Date.now() + expiresIn * 1000).toISOString(); }

async function logEvent(accountId: string, eventType: string, status: string, message?: string, response?: unknown) {
  await supabase.from('cb_instagram_publish_logs').insert({ account_id: accountId, event_type: eventType, status, message, graph_response: response || null });
}

async function refreshToken(account: any) {
  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', account.access_token);
  const res = await fetch(url.toString());
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw Object.assign(new Error(data?.error?.message || `Meta token refresh ${res.status}`), { response: data });
  const token = data.access_token || account.access_token;
  const expiration = expiresAt(Number(data.expires_in || 60 * 24 * 60 * 60));
  const { error } = await supabase.from('cb_instagram_accounts').update({ access_token: token, token_expires_at: expiration, token_last_refreshed_at: new Date().toISOString(), is_active: true, last_error: null, updated_at: new Date().toISOString() }).eq('id', account.id);
  if (error) throw new Error(error.message);
  await logEvent(account.id, 'token_refreshed', 'ok', `expires ${expiration}`, { expires_at: expiration });
  return { id: account.id, username: account.instagram_username, ok: true, expires_at: expiration };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (!CRON_SECRET || url.searchParams.get('secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, { status: 401 });
    if (!META_APP_ID || !META_APP_SECRET) throw new Error('META_APP_ID/META_APP_SECRET não configurados');
    const { data: accounts, error } = await supabase
      .from('cb_instagram_accounts')
      .select('*')
      .eq('is_active', true)
      .or(`token_expires_at.is.null,token_expires_at.lte.${refreshBeforeIso()}`)
      .limit(20);
    if (error) throw new Error(error.message);
    const results = [];
    for (const account of accounts || []) {
      try { results.push(await refreshToken(account)); }
      catch (err: any) {
        const message = String(err?.message || err);
        await supabase.from('cb_instagram_accounts').update({ last_error: message.slice(0, 1000), updated_at: new Date().toISOString() }).eq('id', account.id);
        await logEvent(account.id, 'token_refresh_failed', 'error', message.slice(0, 1000), err?.response || null);
        results.push({ id: account.id, username: account.instagram_username, ok: false, error: message });
      }
    }
    return json({ ok: true, count: results.length, results });
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
});
