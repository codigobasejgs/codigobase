import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { isOptOutMessage } from '../_shared/outboundSafety.ts';

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
    const mediaUrl = new URL(info.mediaUrl);
    const evolutionUrl = new URL(EVOLUTION_API_URL);
    if (mediaUrl.protocol !== 'https:' || mediaUrl.origin !== evolutionUrl.origin) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(mediaUrl, { headers: { apikey: EVOLUTION_API_KEY }, redirect: 'error', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) return null;
    const length = Number(response.headers.get('content-length') || 0);
    if (length > 8 * 1024 * 1024) return null;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) return null;
    const bytes = new Uint8Array(buffer);
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

async function askGemini(prompt: string, mediaPart: any, apiKey: string, model: string) {
  const parts: any[] = [{ text: prompt }];
  if (mediaPart) parts.push(mediaPart);

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
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
    if (!WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'webhook_not_configured' }), { status: 503, headers: corsHeaders });
    }
    if (url.searchParams.get('secret') !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const payload = await req.json();
    const info = extractInfo(payload);

    if (!info) {
      await supabase.from('cb_webhook_logs').insert({ event: payload?.event, ignored: true, ignore_reason: 'missing_remote_jid', payload });
      return new Response(JSON.stringify({ ok: true, ignored: true }), { headers: corsHeaders });
    }
    if (!info.messageId) {
      await supabase.from('cb_webhook_logs').insert({ event: info.event, remote_jid: info.remoteJid, ignored: true, ignore_reason: 'missing_message_id', payload: {} });
      return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'missing_message_id' }), { headers: corsHeaders });
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

    const phone = phoneFromJid(info.remoteJid);
    if (!phone) throw new Error('Invalid remote JID');

    const { data: existingContact, error: existingContactError } = await supabase
      .from('cb_whatsapp_contacts')
      .select('*')
      .eq('remote_jid', info.remoteJid)
      .maybeSingle();
    if (existingContactError) throw existingContactError;

    const { data: contact, error: contactError } = await supabase.from('cb_whatsapp_contacts').upsert({
      remote_jid: info.remoteJid,
      phone,
      push_name: info.pushName || existingContact?.push_name,
      is_group: false,
      suspected_bot: Boolean(existingContact?.suspected_bot || botDetected),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'remote_jid' }).select().single();
    if (contactError || !contact) throw contactError || new Error('Contact upsert failed');

    const receivedAt = new Date().toISOString();
    const { data: conversation, error: conversationError } = await supabase.rpc('cb_preserve_conversation_state', {
      target_remote_jid: info.remoteJid,
      target_contact_id: contact.id,
      target_suspected_bot: botDetected,
      target_wants_human: wantsHuman,
      target_service_interest: serviceInterest,
      target_last_message_at: receivedAt,
    });
    if (conversationError || !conversation) throw conversationError || new Error('Conversation upsert failed');

    const { data: insertedMessage, error: messageError } = await supabase.from('cb_whatsapp_messages').insert({
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
    }).select('id').single();

    const optedOut = isOptOutMessage(info.text || '');
    if (messageError?.code === '23505') {
      if (optedOut) {
        const { data: existingMessage, error: existingMessageError } = await supabase
          .from('cb_whatsapp_messages')
          .select('id')
          .eq('evolution_message_id', info.messageId)
          .single();
        if (existingMessageError || !existingMessage) throw existingMessageError || new Error('Duplicate message lookup failed');
        const phoneE164 = `+${phone}`;
        const { error: suppressionError } = await supabase.from('cb_whatsapp_suppressions').upsert({
          phone_e164: phoneE164,
          reason: 'opt_out',
          source_message_id: existingMessage.id,
          suppressed_at: receivedAt,
        }, { onConflict: 'phone_e164' });
        if (suppressionError) throw suppressionError;
        const [conversationUpdate, prospectUpdate] = await Promise.all([
          supabase.from('cb_whatsapp_conversations').update({ ai_paused: true, pause_reason: 'opt_out', updated_at: receivedAt }).eq('id', conversation.id),
          supabase.from('cb_outbound_prospects').update({ status: 'opted_out', updated_at: receivedAt }).eq('phone_e164', phoneE164),
        ]);
        if (conversationUpdate.error || prospectUpdate.error) throw conversationUpdate.error || prospectUpdate.error;
      }
      await supabase.from('cb_webhook_logs').insert({ event: info.event, remote_jid: info.remoteJid, ignored: true, ignore_reason: 'duplicate_message', payload: {} });
      return new Response(JSON.stringify({ ok: true, ignored: true, reason: 'duplicate_message', optOut: optedOut }), { headers: corsHeaders });
    }
    if (messageError || !insertedMessage) throw messageError || new Error('Message insert failed');

    await supabase.from('cb_webhook_logs').insert({ event: info.event, remote_jid: info.remoteJid, ignored: false, payload: {} });

    const phoneE164 = `+${phone}`;
    if (optedOut) {
      const { error: suppressionError } = await supabase.from('cb_whatsapp_suppressions').upsert({
        phone_e164: phoneE164,
        reason: 'opt_out',
        source_message_id: insertedMessage.id,
        suppressed_at: receivedAt,
      }, { onConflict: 'phone_e164' });
      if (suppressionError) throw suppressionError;
      const [conversationUpdate, prospectUpdate] = await Promise.all([
        supabase.from('cb_whatsapp_conversations').update({ ai_paused: true, pause_reason: 'opt_out', updated_at: receivedAt }).eq('id', conversation.id),
        supabase.from('cb_outbound_prospects').update({ status: 'opted_out', updated_at: receivedAt }).eq('phone_e164', phoneE164),
      ]);
      if (conversationUpdate.error || prospectUpdate.error) throw conversationUpdate.error || prospectUpdate.error;
      return new Response(JSON.stringify({ ok: true, ai: 'paused', optOut: true }), { headers: corsHeaders });
    }

    const { error: repliedError } = await supabase.from('cb_outbound_prospects')
      .update({ status: 'replied', updated_at: receivedAt })
      .eq('phone_e164', phoneE164)
      .eq('status', 'contacted');
    if (repliedError) throw repliedError;

    if (!settings?.enabled || conversation.ai_paused || botDetected || wantsHuman) {
      return new Response(JSON.stringify({ ok: true, ai: 'paused' }), { headers: corsHeaders });
    }

    const mediaPart = await fetchMediaAsPart(info);
    const model = settings?.model || GEMINI_MODEL;
    const apiKey = settings?.gemini_api_key || GEMINI_API_KEY;
    const customerName = info.pushName?.split(' ')?.[0] || '';
    const aiPrompt = `${settings.system_prompt}\n\nREGRAS DE COMPORTAMENTO PRIORITÁRIAS:\n${settings?.behavior_rules || 'Tamanho da resposta: curto/médio, estilo WhatsApp. Objetivo: qualificar o cliente antes de vender. Fluxo: uma pergunta por vez, sem textão. Não começar listando tudo; comece perguntando o que o cliente precisa e aprofunde somente no serviço demonstrado.'}\n\nNOME DO CLIENTE NO WHATSAPP:\n${customerName || 'Nome não disponível. Pergunte de forma natural como pode chamar o cliente antes de aprofundar.'}\n\nOPÇÕES GUIADAS POR SERVIÇO:\n${settings?.guided_service_options || 'Quando o cliente demonstrar interesse em um serviço, ofereça opções numeradas curtas e permita resposta livre. Se responder número, interprete no contexto do serviço. Se escolher explicar melhor, peça uma descrição livre.'}\n\nMensagem do cliente: ${info.text || '[mídia enviada sem texto]'}\n\nSe houver mídia anexada, analise imagem/áudio/documento e responda naturalmente. Se o cliente quiser humano, diga que vai chamar um especialista e não continue insistindo.`;
    const aiText = await askGemini(aiPrompt, mediaPart, apiKey, model);

    if (aiText) {
      const [{ data: latestConversation, error: latestConversationError }, { data: suppression, error: suppressionError }] = await Promise.all([
        supabase.from('cb_whatsapp_conversations').select('ai_paused').eq('id', conversation.id).single(),
        supabase.from('cb_whatsapp_suppressions').select('id').eq('phone_e164', phoneE164).maybeSingle(),
      ]);
      if (latestConversationError || suppressionError) throw latestConversationError || suppressionError;
      if (latestConversation?.ai_paused || suppression) {
        return new Response(JSON.stringify({ ok: true, ai: 'paused_before_send' }), { headers: corsHeaders });
      }
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
