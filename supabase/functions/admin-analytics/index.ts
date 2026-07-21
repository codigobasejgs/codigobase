import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: corsHeaders });
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authorization } } });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: corsHeaders });
  if (authData.user.app_metadata?.role !== 'admin') return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: corsHeaders });

  const since = new URL(req.url).searchParams.get('since') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [analytics, daily, services, paused] = await Promise.all([
    supabase.from('whatsapp_admin_analytics').select('*').single(),
    supabase.from('cb_whatsapp_messages').select('created_at').gte('created_at', since).eq('from_me', false),
    supabase.from('cb_whatsapp_conversations').select('service_interest').not('service_interest', 'is', null),
    supabase.from('cb_whatsapp_conversations').select('id, remote_jid, pause_reason, updated_at').eq('ai_paused', true).order('updated_at', { ascending: false }).limit(20),
  ]);

  const messagesByDay = (daily.data || []).reduce((acc: Record<string, number>, row: any) => {
    const day = row.created_at.slice(0, 10);
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});

  const serviceCounts = (services.data || []).reduce((acc: Record<string, number>, row: any) => {
    acc[row.service_interest] = (acc[row.service_interest] || 0) + 1;
    return acc;
  }, {});

  return new Response(JSON.stringify({
    ok: true,
    analytics: analytics.data,
    messagesByDay,
    serviceCounts,
    pausedConversations: paused.data || [],
  }), { headers: corsHeaders });
});
