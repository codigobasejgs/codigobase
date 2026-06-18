import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID') || '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || '';
const META_REDIRECT_URI = Deno.env.get('META_REDIRECT_URI') || `${SUPABASE_URL}/functions/v1/instagram-oauth-callback`;
const META_OAUTH_SCOPES = Deno.env.get('META_OAUTH_SCOPES') || 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish';
const META_LOGIN_CONFIG_ID = Deno.env.get('META_LOGIN_CONFIG_ID') || '';

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function base64url(input: ArrayBuffer | string) { const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input); let bin = ''; bytes.forEach((b) => bin += String.fromCharCode(b)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function hmac(text: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(META_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return base64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))); }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); return data.user; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(req.headers.get('Authorization') || '');
    if (!META_APP_ID || !META_APP_SECRET) throw new Error('META_APP_ID/META_APP_SECRET não configurados');
    const ts = Date.now().toString();
    const body = `${user.id}.${ts}`;
    const state = base64url(`${body}.${await hmac(body)}`);
    const url = new URL('https://www.facebook.com/v23.0/dialog/oauth');
    url.searchParams.set('client_id', META_APP_ID);
    url.searchParams.set('redirect_uri', META_REDIRECT_URI);
    url.searchParams.set('scope', META_OAUTH_SCOPES);
    if (META_LOGIN_CONFIG_ID) url.searchParams.set('config_id', META_LOGIN_CONFIG_ID);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('auth_type', 'rerequest');
    url.searchParams.set('enable_profile_selector', 'true');
    url.searchParams.set('state', state);
    return json({ ok: true, url: url.toString() });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
