import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    if (authData.user.app_metadata?.role !== 'admin') return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: corsHeaders });

    const { conversationId, remoteJid, text, pauseAi = true } = await req.json();
    if (!conversationId || !remoteJid || !text) return new Response(JSON.stringify({ ok: false, error: 'conversationId, remoteJid and text are required' }), { status: 400, headers: corsHeaders });

    const { data: conversation, error: conversationError } = await supabase.from('cb_whatsapp_conversations').select('id, remote_jid').eq('id', conversationId).single();
    if (conversationError || !conversation || conversation.remote_jid !== remoteJid) return new Response(JSON.stringify({ ok: false, error: 'conversation_mismatch' }), { status: 409, headers: corsHeaders });

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_API_KEY },
      body: JSON.stringify({ number: remoteJid.split('@')[0], text }),
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();

    if (conversationId) {
      await supabase.from('cb_whatsapp_messages').insert({
        conversation_id: conversationId,
        remote_jid: remoteJid,
        from_me: true,
        sender_type: 'human',
        message_type: 'text',
        content: text,
        raw_payload: result,
      });

      if (pauseAi) {
        await supabase.from('cb_whatsapp_conversations').update({
          ai_paused: true,
          pause_reason: 'human_intervention',
          last_human_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', conversationId);
      }
    }

    return new Response(JSON.stringify({ ok: true, result }), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), { status: 500, headers: corsHeaders });
  }
});
