import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID') || '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || '';
const META_GRAPH_VERSION = Deno.env.get('META_GRAPH_VERSION') || 'v23.0';
const META_REDIRECT_URI = Deno.env.get('META_REDIRECT_URI') || `${SUPABASE_URL}/functions/v1/instagram-oauth-callback`;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function html(title: string, body: string, status = 200) { return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Inter,Arial;background:#05070D;color:#fff;display:grid;place-items:center;min-height:100vh}main{max-width:620px;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:32px;background:rgba(255,255,255,.04)}a{color:#22d3ee}</style></head><body><main><h1>${title}</h1><p>${body}</p><p>Você pode voltar ao Admin Código Base.</p></main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }); }
function decodeBase64url(input: string) { const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - input.length % 4) % 4); return atob(b64); }
function base64url(input: ArrayBuffer) { const bytes = new Uint8Array(input); let bin = ''; bytes.forEach((b) => bin += String.fromCharCode(b)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
async function hmac(text: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(META_APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return base64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))); }
async function validateState(state: string) { const raw = decodeBase64url(state); const parts = raw.split('.'); if (parts.length !== 3) throw new Error('state inválido'); const [userId, ts, sig] = parts; const age = Date.now() - Number(ts); if (!userId || !ts || age < 0 || age > 15 * 60 * 1000) throw new Error('state expirado'); const expected = await hmac(`${userId}.${ts}`); if (sig !== expected) throw new Error('state inválido'); return userId; }
async function graph(path: string, params: Record<string, string>) { const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}${path}`); Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v)); const res = await fetch(url); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data?.error?.message || JSON.stringify(data)); return data; }

Deno.serve(async (req) => {
  try {
    if (!META_APP_ID || !META_APP_SECRET) throw new Error('META_APP_ID/META_APP_SECRET não configurados');
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const denied = url.searchParams.get('error_description') || url.searchParams.get('error_message');
    if (denied) throw new Error(denied);
    if (!code || !state) throw new Error('code/state ausente');
    const userId = await validateState(state);
    const shortToken = await graph('/oauth/access_token', { client_id: META_APP_ID, client_secret: META_APP_SECRET, redirect_uri: META_REDIRECT_URI, code });
    const longToken = await graph('/oauth/access_token', { grant_type: 'fb_exchange_token', client_id: META_APP_ID, client_secret: META_APP_SECRET, fb_exchange_token: shortToken.access_token });
    const accessToken = longToken.access_token || shortToken.access_token;
    const expiresIn = Number(longToken.expires_in || shortToken.expires_in || 60 * 24 * 60 * 60);
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const me = await graph('/me', { fields: 'id,name', access_token: accessToken });
    const permissions = await graph('/me/permissions', { access_token: accessToken }).catch(() => ({ data: [] }));
    const granted = (permissions?.data || []).filter((p: any) => p.status === 'granted').map((p: any) => p.permission);
    const pages = await graph('/me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username},connected_instagram_account{id,username}', access_token: accessToken });
    const connected: string[] = [];
    const checkedPages: string[] = [];
    for (const page of pages?.data || []) {
      checkedPages.push(page.name || page.id);
      let ig = page.instagram_business_account || page.connected_instagram_account;
      if (!ig?.id) {
        try {
          const details = await graph(`/${page.id}`, { fields: 'instagram_business_account{id,username},connected_instagram_account{id,username}', access_token: page.access_token || accessToken });
          ig = details.instagram_business_account || details.connected_instagram_account;
        } catch (_) {}
      }
      if (!ig?.id) continue;
      const { error } = await supabase.from('cb_instagram_accounts').upsert({
        facebook_user_id: me.id,
        facebook_page_id: page.id,
        facebook_page_name: page.name,
        instagram_user_id: ig.id,
        instagram_username: ig.username,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt,
        token_last_refreshed_at: new Date().toISOString(),
        is_active: true,
        last_error: null,
        created_by: userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'instagram_user_id' });
      if (error) throw new Error(error.message);
      connected.push(ig.username || ig.id);
    }
    if (!connected.length) return html('Instagram não encontrado', `Nenhuma conta Instagram Business/Creator vinculada às páginas deste usuário Meta foi encontrada.<br><br>Páginas verificadas: <strong>${checkedPages.join(', ') || 'nenhuma'}</strong>.<br>Permissões concedidas: <strong>${granted.join(', ') || 'nenhuma'}</strong>.<br><br>Se Páginas = nenhuma, o OAuth não recebeu assets da Página. Use Login for Business com Configuration ID ou aceite a tela de seleção de Páginas marcando a Página correta.`, 400);
    return html('Instagram conectado', `Contas conectadas: <strong>${connected.join(', ')}</strong>.`);
  } catch (error) {
    return html('Erro ao conectar Instagram', String(error?.message || error), 500);
  }
});
