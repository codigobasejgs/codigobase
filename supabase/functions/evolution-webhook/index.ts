import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')!;
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')!;
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'codigobase';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3-flash';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type MessageInfo = {
  event?: string;
  remoteJid: string;
  messageId?: string;
  fromMe: boolean;
  pushName?: string;
  messageType: string;
  text: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  raw: unknown;
};

function getMessageText(message: any): string {
  return message?.conversation
    || message?.extendedTextMessage?.text
    || message?.imageMessage?.caption
    || message?.videoMessage?.caption
    || message?.buttonsResponseMessage?.selectedDisplayText
    || message?.listResponseMessage?.title
    || message?.templateButtonReplyMessage?.selectedDisplayText
    || '';
}

function extractInfo(payload: any): MessageInfo | null {
  const data = payload?.data || payload;
  const key = data?.key || payload?.key || {};
  const message = data?.message || payload?.message || {};
  const remoteJid = key?.remoteJid || data?.remoteJid || payload?.remoteJid || '';
  if (!remoteJid) return null;

  const messageType = data?.messageType
    || Object.keys(message || {})[0]
    || payload?.messageType
    || 'text';

  const image = message?.imageMessage;
  const audio = message?.audioMessage;
  const video = message?.videoMessage;
  const document = message?.documentMessage;
  const media = image || audio || video || document;

  return {
    event: payload?.event,
    remoteJid,
    messageId: key?.id || data?.id || payload?.id,
    fromMe: Boolean(key?.fromMe || data?.fromMe || payload?.fromMe),
    pushName: data?.pushName || payload?.pushName || key?.participant,
    messageType,
    text: getMessageText(message),
    mediaUrl: data?.mediaUrl || payload?.mediaUrl || media?.url,
    mediaMimeType: media?.mimetype || data?.mimetype || payload?.mimetype,
    raw: payload,
  };
}

function isGroup(remoteJid: string) {
  return remoteJid.endsWith('@g.us');
}

function phoneFromJid(remoteJid: string) {
  return remoteJid.split('@')[0]?.replace(/\D/g, '') || null;
}

function containsAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function detectService(text: string) {
  const lower = text.toLowerCase();
  const rules: [string, string[]][] = [
    ['IA / Chatbot', ['chatbot', 'bot', 'ia', 'inteligência artificial', 'whatsapp automático', 'automação']],
    ['Sistemas / Apps', ['sistema', 'app', 'aplicativo', 'site', 'saas', 'pwa', 'loja virtual']],
    ['Dashboards / Dados', ['dashboard', 'power bi', 'relatório', 'dados', 'indicador', 'bi']],
    ['Marketing / Instagram', ['instagram', 'post', 'stories', 'marketing', 'conteúdo', 'reels']],
    ['Hardware / Suporte', ['computador', 'notebook', 'rede', 'suporte', 'manutenção', 'formatação', 'ssd', 'ram']],
  ];
  return rules.find(([, words]) => words.some((w) => lower.includes(w)))?.[0] || null;
}

async function fetchMediaAsPart(info: MessageInfo) {
  if (!info.mediaUrl || !info.mediaMimeType) return null;
  try {
    const response = await fetch(info.mediaUrl, { headers: { apikey: EVOLUTION_API_KEY } });
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return {
      inline_data: {
        mime_type: info.mediaMimeType,
        data: btoa(binary),
      },
    };
  } catch {
    return null;
  }
}

async function askGemini(prompt: string, mediaPart: any) {
  const parts: any[] = [{ text: prompt }];
  if (mediaPart) parts.push(mediaPart);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini error: ${error}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n').trim() || '';
}

async function sendWhatsAppText(remoteJid: string, text: string) {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({ number: remoteJid.split('@')[0], text }),
  });

  if (!response.ok) throw new Error(`Evolution send error: ${await response.text()}`);
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    if (WEBHOOK_SECRET && url.searchParams.get('secret') !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const payload = await req.json();
    const info = extractInfo(payload);

    if (!info) {
      await supabase.from('cb_webhook_logs').insert({ event: payload?.event, ignored: true, ignore_reason: 'missing_remote_jid', payload });
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: corsHeaders });
    }

    const group = isGroup(info.remoteJid);
    if (group || info.fromMe || info.remoteJid.includes('broadcast')) {
      await supabase.from('cb_webhook_logs').insert({ event: info.event, remote_jid: info.remoteJid, ignored: true, ignore_reason: group ? 'group' : info.fromMe ? 'from_me' : 'broadcast', payload });
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: corsHeaders });
    }

    const { data: settings } = await supabase.from('cb_ai_settings').select('*').eq('id', 1).single();
    const botDetected = containsAny(info.text || '', settings?.bot_detection_keywords || []);
    const wantsHuman = containsAny(info.text || '', settings?.handoff_keywords || []);
    const serviceInterest = detectService(info.text || '');

    const { data: contact } = await supabase.from('cb_whatsapp_contacts').upsert({
      remote_jid: info.remoteJid,
      phone: phoneFromJid(info.remoteJid),
      push_name: info.pushName,
      is_group: false,
      suspected_bot: botDetected,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'remote_jid' }).select().single();

    const { data: conversation } = await supabase.from('cb_whatsapp_conversations').upsert({
      contact_id: contact.id,
      remote_jid: info.remoteJid,
      is_group: false,
      suspected_bot: botDetected,
      ai_paused: botDetected || wantsHuman,
      pause_reason: botDetected ? 'suspected_bot' : wantsHuman ? 'human_requested' : undefined,
      service_interest: serviceInterest,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'remote_jid' }).select().single();

    await supabase.from('cb_whatsapp_messages').insert({
      conversation_id: conversation.id,
      evolution_message_id: info.messageId,
      remote_jid: info.remoteJid,
      from_me: false,
      sender_type: 'customer',
      message_type: info.messageType,
      content: info.text,
      media_url: info.mediaUrl,
      media_mime_type: info.mediaMimeType,
      raw_payload: payload,
    });

    await supabase.from('cb_webhook_logs').insert({ event: info.event, remote_jid: info.remoteJid, ignored: false, payload });

    if (!settings?.enabled || conversation.ai_paused || botDetected || wantsHuman) {
      return new Response(JSON.stringify({ ok: true, ai: 'paused' }), { headers: corsHeaders });
    }

    const mediaPart = await fetchMediaAsPart(info);
    const aiPrompt = `${settings.system_prompt}\n\nMensagem do cliente: ${info.text || '[mídia enviada sem texto]'}\n\nSe houver mídia anexada, analise imagem/áudio/documento e responda naturalmente. Se o cliente quiser humano, diga que vai chamar um especialista e não continue insistindo.`;
    const aiText = await askGemini(aiPrompt, mediaPart);

    if (aiText) {
      await sendWhatsAppText(info.remoteJid, aiText);
      await supabase.from('cb_whatsapp_messages').insert({
        conversation_id: conversation.id,
        remote_jid: info.remoteJid,
        from_me: true,
        sender_type: 'ai',
        message_type: 'text',
        content: aiText,
        raw_payload: {},
      });
      await supabase.from('cb_whatsapp_conversations').update({ last_ai_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', conversation.id);
    }

    return new Response(JSON.stringify({ ok: true, ai: Boolean(aiText) }), { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), { status: 500, headers: corsHeaders });
  }
});
