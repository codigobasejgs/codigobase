import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const STATUS_ENDPOINT = Deno.env.get('EVOLUTION_STATUS_ENDPOINT') || '/message/sendStatus';
const CRON_SECRET = Deno.env.get('STATUS_CRON_SECRET');

async function sendStatus(post: any) {
  const url = `${EVOLUTION_API_URL}${STATUS_ENDPOINT}/${EVOLUTION_INSTANCE}`;
  const isVideo = post.media_mime_type?.startsWith('video/');
  const payload = post.media_url ? { type: isVideo ? 'video' : 'image', content: post.media_url, caption: post.caption || '', allContacts: true } : { type: 'text', content: post.caption || post.title || 'Código Base', backgroundColor: '#05070D', font: 1, allContacts: true };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }, body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function nextSchedule(post: any) {
  const current = new Date(post.scheduled_at);
  if (post.repeat_type === 'daily') return new Date(current.getTime() + 24 * 60 * 60 * 1000).toISOString();
  if (post.repeat_type === 'weekly') return new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (CRON_SECRET && url.searchParams.get('secret') !== CRON_SECRET) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const now = new Date().toISOString();
    const { data: posts, error } = await supabase.from('cb_whatsapp_status_posts').select('*').eq('status', 'scheduled').lte('scheduled_at', now).order('scheduled_at').limit(10);
    if (error) throw new Error(error.message);

    const results: any[] = [];
    for (const post of posts || []) {
      try {
        await supabase.from('cb_whatsapp_status_posts').update({ status: 'publishing', last_attempt_at: now, error_message: null }).eq('id', post.id);
        const result = await sendStatus(post);
        const next = nextSchedule(post);
        await supabase.from('cb_whatsapp_status_posts').update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', post.id);
        if (next) {
          const { id, published_at, last_attempt_at, error_message, created_at, updated_at, ...clone } = post;
          await supabase.from('cb_whatsapp_status_posts').insert({ ...clone, scheduled_at: next, status: 'scheduled' });
        }
        results.push({ id: post.id, ok: true, result });
      } catch (err) {
        await supabase.from('cb_whatsapp_status_posts').update({ status: 'error', error_message: String(err?.message || err), updated_at: new Date().toISOString() }).eq('id', post.id);
        results.push({ id: post.id, ok: false, error: String(err?.message || err) });
      }
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), { status: 500, headers: corsHeaders });
  }
});
