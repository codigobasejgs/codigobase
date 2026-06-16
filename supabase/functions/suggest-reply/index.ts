import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); }
async function askGemini(prompt: string, apiKey: string, model: string) { const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 350 } }) }); if (!res.ok) throw new Error(`Gemini error: ${(await res.text()).slice(0, 500)}`); const data = await res.json(); return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n').trim() || ''; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    await requireUser(req.headers.get('Authorization') || '');
    const { conversationId, mode = 'reply' } = await req.json();
    if (!conversationId) return json({ ok: false, error: 'conversationId required' }, { status: 400 });
    const { data: conv, error: convError } = await supabase.from('cb_whatsapp_conversations').select('*').eq('id', conversationId).single();
    if (convError || !conv) throw new Error(convError?.message || 'conversation not found');
    const { data: messages, error: msgError } = await supabase.from('cb_whatsapp_messages').select('sender_type,content,message_type,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(20);
    if (msgError) throw new Error(msgError.message);
    const { data: settings } = await supabase.from('cb_ai_settings').select('*').eq('id', 1).single();
    const apiKey = settings?.gemini_api_key || GEMINI_API_KEY;
    const model = (settings?.model || GEMINI_MODEL || 'gemini-2.5-flash').startsWith('gemini-3') ? 'gemini-2.5-flash' : (settings?.model || GEMINI_MODEL);
    if (!apiKey) throw new Error('Gemini API Key não configurada');
    const transcript = (messages || []).reverse().map((m: any) => `[${m.sender_type}] ${m.content || '[' + m.message_type + ']'} (${m.created_at})`).join('\n');
    const prompt = mode === 'sandbox'
      ? `Teste o prompt comercial da Código Base. Gere uma resposta curta estilo WhatsApp para a mensagem simulada abaixo, usando as regras atuais.\n\nPrompt atual:\n${settings?.system_prompt || ''}\n\nMensagem simulada/conversa:\n${transcript}`
      : `Você é Jefferson/Código Base respondendo como humano no WhatsApp. Escreva UMA resposta curta, consultiva e natural para o cliente. Não envie preço fechado. Faça no máximo 1 pergunta objetiva.\n\nServiço detectado: ${conv.service_interest || 'não definido'}\nEtapa CRM: ${conv.lead_stage || 'novo'}\nConversa recente:\n${transcript}\n\nRetorne somente a mensagem pronta para enviar.`;
    const reply = await askGemini(prompt, apiKey, model);
    return json({ ok: true, reply, model });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
