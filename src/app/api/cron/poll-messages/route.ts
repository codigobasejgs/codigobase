import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";
import { generateAIReply } from "@/lib/ai/client";
import type { AISettings, ChatMessage } from "@/lib/ai/client";

// ── Padrões que indicam que o remetente é um chatbot/IA ──
const BOT_PATTERNS = [
  /^(\u{1F916}|\u{1F4AC})\s/u,
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

interface EvolutionMessage {
  key: { id: string; fromMe: boolean; remoteJid: string };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
  };
  pushName?: string;
  messageTimestamp?: number | string;
  messageType?: string;
}

async function fetchEvolutionMessages(
  instanceName: string,
  remoteJid: string,
  limit = 10
): Promise<EvolutionMessage[]> {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_API_BASE}/chat/findMessages/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY || "",
        },
        body: JSON.stringify({ where: { key: { remoteJid } }, limit }),
      }
    );
    const rawText = await res.text();
    // Clean control characters that Evolution sometimes includes
    const cleaned = rawText.replace(/[\x00-\x1F\x7F]/g, (ch) =>
      ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""
    );
    const parsed = JSON.parse(cleaned);
    return parsed?.messages?.records || parsed?.records || [];
  } catch {
    return [];
  }
}

/**
 * Polling endpoint — busca mensagens novas diretamente da Evolution API
 * Duas estratégias:
 * 1. Busca chats da Evolution API (findChats) para novos contatos
 * 2. Busca mensagens novas para conversas JÁ existentes no nosso banco
 */
export async function GET(_request: NextRequest) {
  try {
    const admin = createAdminClient();
    const evolutionClient = getEvolutionClient();
    if (!evolutionClient) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });
    }

    const instanceName = EVOLUTION_INSTANCE();

    const { data: instanceData } = await admin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name_evolution", instanceName)
      .single();

    const instanceId = instanceData?.id ?? null;
    if (!instanceId) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    }

    // ── ESTRATÉGIA 1: Buscar chats da Evolution para descobrir novos contatos ──
    const jidsToCheck = new Set<string>();
    const contactNames = new Map<string, string>();

    try {
      const rawChats = await evolutionClient.getChats(instanceName);
      const chats = Array.isArray(rawChats) ? rawChats : [];
      for (const chat of chats) {
        const jid = (chat as unknown as Record<string, string>).remoteJid ?? chat.id ?? "";
        if (jid.endsWith("@s.whatsapp.net") && jid !== "status@broadcast") {
          jidsToCheck.add(jid);
          const name = (chat as unknown as Record<string, string>).pushName || chat.name || "";
          if (name) contactNames.set(jid, name);
        }
      }
    } catch (err) {
      console.error("[Poll] Error fetching chats:", err);
    }

    // ── ESTRATÉGIA 2: Buscar conversas existentes no nosso banco ──
    const { data: existingConvs } = await admin
      .from("whatsapp_conversations")
      .select("remote_jid, contact_name")
      .eq("instance_id", instanceId);

    for (const conv of existingConvs ?? []) {
      if (conv.remote_jid?.endsWith("@s.whatsapp.net")) {
        jidsToCheck.add(conv.remote_jid);
        if (conv.contact_name && !contactNames.has(conv.remote_jid)) {
          contactNames.set(conv.remote_jid, conv.contact_name);
        }
      }
    }

    let newMessages = 0;
    let processed = 0;

    for (const remoteJid of Array.from(jidsToCheck).slice(0, 50)) {
      const contactName = contactNames.get(remoteJid) || remoteJid.split("@")[0];

      // Buscar mensagens da Evolution
      const messages = await fetchEvolutionMessages(instanceName, remoteJid, 10);
      if (!messages.length) {
        processed++;
        continue;
      }

      for (const msg of messages) {
        const messageId = msg.key?.id;
        if (!messageId) continue;

        // Check se já temos esta mensagem
        const { data: existing } = await admin
          .from("whatsapp_messages")
          .select("id")
          .eq("message_id_evolution", messageId)
          .maybeSingle();

        if (existing) continue;

        const fromMe = msg.key?.fromMe ?? false;
        const text =
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          "";

        if (!text) continue;

        // Upsert conversation
        const { data: convData } = await admin
          .from("whatsapp_conversations")
          .upsert(
            {
              instance_id: instanceId,
              remote_jid: remoteJid,
              contact_name: msg.pushName || contactName,
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
            .update({
              unread_count: (convData.unread_count ?? 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", convData.id);
        }

        // Store message
        await admin.from("whatsapp_messages").insert({
          instance_id: instanceId,
          conversation_id: convData?.id ?? null,
          remote_jid: remoteJid,
          contact_name: msg.pushName || contactName,
          direcao: fromMe ? "out" : "in",
          conteudo: text,
          tipo: "texto",
          message_id_evolution: messageId,
          status: "entregue",
          created_at: msg.messageTimestamp
            ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        newMessages++;

        // Admin respondeu pelo celular → pausar IA
        if (fromMe) {
          if (convData?.id) {
            await admin
              .from("whatsapp_conversations")
              .update({ ai_paused: true, updated_at: new Date().toISOString() })
              .eq("id", convData.id);
          }
          continue;
        }

        // ── Resposta IA ──
        if (!fromMe && text && !(convData?.ai_paused)) {
          if (looksLikeBot(text)) {
            if (convData?.id) {
              await admin
                .from("whatsapp_conversations")
                .update({ ai_paused: true, updated_at: new Date().toISOString() })
                .eq("id", convData.id);
            }
            continue;
          }

          // Trigger AI reply (SYNC)
          try {
            await triggerAIReply(admin, remoteJid, instanceName, text, convData?.id);
          } catch (aiErr) {
            console.error("[Poll] AI reply error:", aiErr);
          }
        }
      }
      processed++;
    }

    return NextResponse.json({
      ok: true,
      jids_checked: jidsToCheck.size,
      chats_checked: processed,
      new_messages: newMessages,
    });
  } catch (err) {
    console.error("[Poll] Error:", err);
    const message = err instanceof Error ? err.message : "Erro no polling";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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

  if (conversationId) {
    const { data: conv } = await admin
      .from("whatsapp_conversations")
      .select("ai_paused")
      .eq("id", conversationId)
      .single();
    if (conv?.ai_paused) return;
  }

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

  if (conversationId) {
    const { data: conv } = await admin
      .from("whatsapp_conversations")
      .select("ai_paused")
      .eq("id", conversationId)
      .single();
    if (conv?.ai_paused) return;
  }

  console.log("[AI] Generating reply for", remoteJid, "text:", incomingText.slice(0, 50));
  const reply = await generateAIReply(messages, settings);
  if (!reply) {
    console.log("[AI] No reply generated");
    return;
  }
  console.log("[AI] Reply:", reply.slice(0, 100));

  const evolutionClient = getEvolutionClient();
  if (!evolutionClient) return;

  const sendResult = await evolutionClient.sendMessage(instanceName, remoteJid.split("@")[0], reply);
  console.log("[AI] Message sent, key:", (sendResult as { key?: { id?: string } })?.key?.id);

  const { data: instData } = await admin
    .from("whatsapp_instances")
    .select("id")
    .eq("instance_name_evolution", instanceName)
    .single();

  await admin.from("whatsapp_messages").insert({
    instance_id: instData?.id ?? null,
    conversation_id: conversationId ?? null,
    remote_jid: remoteJid,
    direcao: "out",
    conteudo: reply,
    tipo: "texto",
    message_id_evolution: (sendResult as { key?: { id?: string } })?.key?.id ?? null,
    status: "entregue",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await admin
    .from("whatsapp_conversations")
    .update({
      last_message: reply.slice(0, 200),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("remote_jid", remoteJid);

  console.log("[AI] Reply stored and conversation updated");
}
