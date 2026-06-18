import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('INSTAGRAM_CRON_SECRET');
const STALE_MINUTES = Number(Deno.env.get('INSTAGRAM_PUBLISHING_STALE_MINUTES') || 15);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function nowIso() { return new Date().toISOString(); }
function staleIso() { return new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString(); }
function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }

async function invokePublisher(id: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/publish-instagram-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ id }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) return { id, ok: false, error: data.error || `publisher ${res.status}`, data };
  return { id, ok: true, ...data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (!CRON_SECRET || url.searchParams.get('secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, { status: 401 });
    const due = nowIso();
    const stale = staleIso();
    const { data: posts, error } = await supabase
      .from('cb_instagram_posts')
      .select('id,status,scheduled_at,publishing_started_at')
      .or(`and(status.eq.scheduled,scheduled_at.lte.${due}),and(status.eq.publishing,publishing_started_at.lt.${stale})`)
      .order('scheduled_at')
      .limit(3);
    if (error) throw new Error(error.message);
    const results = [];
    for (const post of posts || []) results.push(await invokePublisher(post.id));
    return json({ ok: true, count: results.length, results });
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
});
