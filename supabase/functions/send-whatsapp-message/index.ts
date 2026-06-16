import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { conversationId, remoteJid, text, pauseAi = true } = await req.json();
    if (!remoteJid || !text) throw new Error('remoteJid and text are required');

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
