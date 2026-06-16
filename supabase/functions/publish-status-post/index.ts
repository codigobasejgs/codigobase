import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const STATUS_ENDPOINT = Deno.env.get('EVOLUTION_STATUS_ENDPOINT') || '/message/sendStatus';

async function sendStatus(post: any) {
  const url = `${EVOLUTION_API_URL}${STATUS_ENDPOINT}/${EVOLUTION_INSTANCE}`;
  const isVideo = post.media_mime_type?.startsWith('video/');
  const payload = post.media_url ? {
    type: isVideo ? 'video' : 'image',
    content: post.media_url,
    caption: post.caption || '',
    allContacts: true,
  } : {
    type: 'text',
    content: post.caption || post.title || 'Código Base',
    backgroundColor: '#05070D',
    font: 1,
    allContacts: true,
  };

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY }, body: JSON.stringify(payload) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { id } = await req.json();
    if (!id) throw new Error('id required');
    const { data: post, error } = await supabase.from('cb_whatsapp_status_posts').select('*').eq('id', id).single();
    if (error || !post) throw new Error(error?.message || 'post not found');
    if (!['scheduled','error'].includes(post.status)) return new Response(JSON.stringify({ ok: true, skipped: post.status }), { headers: corsHeaders });

    await supabase.from('cb_whatsapp_status_posts').update({ status: 'publishing', last_attempt_at: new Date().toISOString(), error_message: null }).eq('id', id);
    const result = await sendStatus(post);
    await supabase.from('cb_whatsapp_status_posts').update({ status: 'published', published_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_message: null }).eq('id', id);
    return new Response(JSON.stringify({ ok: true, result }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), { status: 500, headers: corsHeaders });
  }
});
