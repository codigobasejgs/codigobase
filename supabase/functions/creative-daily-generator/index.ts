import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_SECRET = Deno.env.get('CREATIVE_CRON_SECRET') || Deno.env.get('INSTAGRAM_CRON_SECRET');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
async function invokeGenerate(campaign: any) { const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-ai-creatives`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify({ campaignId: campaign.id, themeCategory: campaign.theme_category, themeOption: campaign.theme_option, platforms: campaign.platforms, storyCount: campaign.daily_story_count, carouselSlideCount: campaign.carousel_slide_count }) }); const data = await res.json().catch(() => ({})); return { campaignId: campaign.id, ok: res.ok && data.ok, data }; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    if (!CRON_SECRET || url.searchParams.get('secret') !== CRON_SECRET) return json({ error: 'unauthorized' }, { status: 401 });
    const { data: campaigns, error } = await supabase.from('cb_ai_creative_campaigns').select('*').eq('is_active', true).limit(5);
    if (error) throw new Error(error.message);
    const results = [];
    for (const campaign of campaigns || []) results.push(await invokeGenerate(campaign));
    return json({ ok: true, count: results.length, results });
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
});
