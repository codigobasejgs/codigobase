import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";
import { generateAIReply } from "@/lib/ai/client";
import type { AISettings, ChatMessage } from "@/lib/ai/client";

// ── Padrões que indicam que o remetente é um chatbot/IA ──
const BOT_PATTERNS = [
  /^(\u{1F916}|\u{1F4AC})\s/u,                        // Começa com 🤖 ou 💬
  /\b(sou uma? (ia|intelig[eê]ncia artificial|assistente virtual|chatbot|bot))\b/i,
  /\b(i'?m (a |an )?(ai|artificial intelligence|chatbot|bot|virtual assistant))\b/i,
  /\b(powered by (gpt|openai|gemini|claude|anthropic|chatgpt|dialogflow|watson))\b/i,
  /\b(gerado por (ia|intelig[eê]ncia artificial))\b/i,
  /\b(auto[\s-]?reply|auto[\s-]?resposta|resposta autom[aá]tica)\b/i,
  /\b(this is an automated message|esta é uma mensagem autom[aá]tica)\b/i,
];

function looksLikeBot(text: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(text));
}

// ── Normaliza o nome do evento (Evolution v1 vs v2 vs Baileys) ──
function normalizeEvent(raw: string): string {
  // Evolution pode enviar: MESSAGES_UPSERT, messages.upsert, MESSAGES.UPSERT, etc
  return raw.toUpperCase().replace(/[.\-]/g, "_");
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();

  try {
    const body = await request.json();

    // ── DEBUG LOG: Salva TODOS os webhooks recebidos ──
    const debugPayload = JSON.stringify(body).slice(0, 4000);
    console.log("[Webhook] Raw event:", debugPayload.slice(0, 800));
    try {
      await admin.from("whatsapp_messages").insert({
        remote_jid: "debug@webhook.log",
        direcao: "in",
        conteudo: debugPayload,
        tipo: "debug",
        message_id_evolution: `WH_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "debug",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (logErr) {
      console.log("[Webhook] Debug log failed:", logErr);
    }

    // ── Determinar o evento ──
    // Evolution v2 pode enviar o evento como:
    // - { event: "MESSAGES_UPSERT", data: {...} }          (formato padrão)
    // - { event: "messages.upsert", data: {...} }          (formato Baileys)
    // - { event: "MESSAGES_UPSERT", instance: "...", ... } (evento achatado)
    // - Root-level message fields sem "event" wrapper
    const rawEvent: string = body?.event ?? body?.type ?? "";
    const event = normalizeEvent(rawEvent);

    // O "data" pode estar em body.data ou diretamente no body
    const data = body?.data ?? body;

    // ── QR Code ──
    if (event === "QRCODE_UPDATED") {
      const qrBase64 = data?.qrcode?.base64 ?? data?.qrcode;
      if (qrBase64) {
        const instanceName = data?.instance ?? body?.instance ?? EVOLUTION_INSTANCE();
        await admin
          .from("whatsapp_instances")
          .update({ qrcode_url: qrBase64, status: "aguardando_qr", updated_at: new Date().toISOString() })
          .eq("instance_name_evolution", instanceName);
      }
    }

    // ── Conexão ──
    if (event === "CONNECTION_UPDATE") {
      const state = data?.state ?? data?.connectionStatus ?? data?.statusReason;
      const instanceName = data?.instance ?? body?.instance ?? EVOLUTION_INSTANCE();
      const statusMap: Record<string, string> = {
        open: "conectado",
        close: "desconectado",
        connecting: "conectando",
      };
      await admin
        .from("whatsapp_instances")
        .update({ status: statusMap[state] ?? state, updated_at: new Date().toISOString() })
        .eq("instance_name_evolution", instanceName);
    }

    // ── Mensagens ──
    if (event === "MESSAGES_UPSERT" || event === "MESSAGES_UPDATE" || event === "SEND_MESSAGE") {
      // Evolution pode enviar como array ou objeto único
      const messages = Array.isArray(data?.messages)
        ? data.messages
        : data?.message
          ? [data.message]
          : Array.isArray(data)
            ? data
            : [data];

      for (const msg of messages) {
        if (!msg?.key) continue;

        const remoteJid: string = msg?.key?.remoteJid ?? "";
        const fromMe: boolean = msg?.key?.fromMe ?? false;
        const messageId: string = msg?.key?.id ?? "";
        const instanceName: string = data?.instance ?? body?.instance ?? EVOLUTION_INSTANCE();
        const pushName: string = msg?.pushName ?? data?.pushName ?? "";

        const text: string =
          msg?.message?.conversation ??
          msg?.message?.extendedTextMessage?.text ??
          msg?.message?.imageMessage?.caption ??
          msg?.message?.videoMessage?.caption ??
          msg?.message?.buttonsResponseMessage?.selectedDisplayText ??
          msg?.message?.listResponseMessage?.title ??
          msg?.message?.templateButtonReplyMessage?.selectedDisplayText ??
          // Evolution v2 pode ter texto em nível diferente
          msg?.body ??
          msg?.text ??
          "";

        // ──────────────────────────────────────────────
        // REGRA 1: Ignorar grupos (@g.us) e broadcasts
        // ──────────────────────────────────────────────
        if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue;

        const instanceId = await getInstanceId(admin, instanceName);

        // ──────────────────────────────────────────────
        // REGRA 3: Admin respondeu manualmente via
        //          Evolution (fromMe=true, mas NÃO veio
        //          do nosso endpoint /send que já pausa)
        //          → pausar IA nessa conversa
        // ──────────────────────────────────────────────
        if (fromMe && text) {
          const { data: existingMsg } = await admin
            .from("whatsapp_messages")
            .select("id")
            .eq("message_id_evolution", messageId)
            .maybeSingle();

          if (!existingMsg) {
            await admin
              .from("whatsapp_conversations")
              .update({ ai_paused: true, updated_at: new Date().toISOString() })
              .eq("remote_jid", remoteJid)
              .eq("instance_id", instanceId);
          }
        }

        // Upsert conversation
        const { data: convData } = await admin
          .from("whatsapp_conversations")
          .upsert(
            {
              instance_id: instanceId,
              remote_jid: remoteJid,
              contact_name: pushName || remoteJid.split("@")[0],
              last_message: text.slice(0, 200),
              last_message_at: new Date().toISOString(),
              unread_count: fromMe ? 0 : 1,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "instance_id,remote_jid", ignoreDuplicates: false }
          )
          .select("id, ai_paused, unread_count")
          .single();

        // Increment unread if incoming
        if (!fromMe && convData?.id) {
          await admin
            .from("whatsapp_conversations")
            .update({ unread_count: (convData.unread_count ?? 0) + 1, updated_at: new Date().toISOString() })
            .eq("id", convData.id);
        }

        // Store message (skip if already stored by our send endpoint)
        const { data: existing } = await admin
          .from("whatsapp_messages")
          .select("id")
          .eq("message_id_evolution", messageId)
          .maybeSingle();

        if (!existing && messageId) {
          await admin.from("whatsapp_messages").insert({
            instance_id: instanceId,
            conversation_id: convData?.id ?? null,
            remote_jid: remoteJid,
            contact_name: pushName || null,
            direcao: fromMe ? "out" : "in",
            conteudo: text,
            tipo: "texto",
            message_id_evolution: messageId,
            status: "entregue",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // ──────────────────────────────────────────────
        // Decidir se dispara IA
        // ──────────────────────────────────────────────
        if (!fromMe && text && !(convData?.ai_paused)) {
          // REGRA 2: Detectar se é chatbot/IA → pausar
          if (looksLikeBot(text)) {
            if (convData?.id) {
              await admin
                .from("whatsapp_conversations")
                .update({ ai_paused: true, updated_at: new Date().toISOString() })
                .eq("id", convData.id);
            }
            console.log(`[AI] Bot detected for ${remoteJid}, pausing AI`);
            continue;
          }

          triggerAIReply(admin, remoteJid, instanceName, text, convData?.id).catch(console.error);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Evolution webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function getInstanceId(admin: ReturnType<typeof createAdminClient>, instanceName: string): Promise<string | null> {
  const { data } = await admin
    .from("whatsapp_instances")
    .select("id")
    .eq("instance_name_evolution", instanceName)
    .single();
  return data?.id ?? null;
}

async function triggerAIReply(
  admin: ReturnType<typeof createAdminClient>,
  remoteJid: string,
  instanceName: string,
  incomingText: string,
  conversationId?: string | null
) {
  const { data: aiConfig } = await admin
    .from("ai_settings")
    .select("*")
    .eq("auto_reply", true)
    .single();

  if (!aiConfig || !aiConfig.api_key) return;

  // Re-check ai_paused right before replying
  if (conversationId) {
    const { data: conv } = await admin
      .from("whatsapp_conversations")
      .select("ai_paused")
      .eq("id", conversationId)
      .single();
    if (conv?.ai_paused) return;
  }

  // Fetch recent conversation history
  const { data: history } = await admin
    .from("whatsapp_messages")
    .select("direcao, conteudo")
    .eq("remote_jid", remoteJid)
    .order("created_at", { ascending: false })
    .limit(20);

  const messages: ChatMessage[] = (history ?? [])
    .reverse()
    .map((m: { direcao: string; conteudo: string }) => ({
      role: m.direcao === "out" ? "assistant" : "user",
      content: m.conteudo,
    }));

  if (!messages.length || messages[messages.length - 1].content !== incomingText) {
    messages.push({ role: "user", content: incomingText });
  }

  const settings: AISettings = {
    provider: aiConfig.provider,
    api_key: aiConfig.api_key,
    model: aiConfig.model,
    system_prompt: aiConfig.system_prompt,
    max_tokens: aiConfig.max_tokens,
  };

  const delay = aiConfig.auto_reply_delay_ms ?? 3000;
  await new Promise((r) => setTimeout(r, delay));

  // Re-check AGAIN after delay
  if (conversationId) {
    const { data: conv } = await admin
      .from("whatsapp_conversations")
      .select("ai_paused")
      .eq("id", conversationId)
      .single();
    if (conv?.ai_paused) return;
  }

  const reply = await generateAIReply(messages, settings);
  if (!reply) return;

  const evolutionClient = getEvolutionClient();
  if (!evolutionClient) return;

  await evolutionClient.sendMessage(instanceName, remoteJid.split("@")[0], reply);

  const instanceId = await getInstanceId(admin, instanceName);
  await admin.from("whatsapp_messages").insert({
    instance_id: instanceId,
    conversation_id: conversationId ?? null,
    remote_jid: remoteJid,
    direcao: "out",
    conteudo: reply,
    tipo: "texto",
    status: "entregue",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await admin
    .from("whatsapp_conversations")
    .update({ last_message: reply.slice(0, 200), last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("remote_jid", remoteJid);
}
