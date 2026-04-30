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

/**
 * Polling endpoint — busca mensagens novas diretamente da Evolution API
 * Chamado pelo frontend a cada 10s enquanto o admin está logado
 * Também pode ser chamado manualmente: GET /api/cron/poll-messages
 */
export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const evolutionClient = getEvolutionClient();
    if (!evolutionClient) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });
    }

    const instanceName = EVOLUTION_INSTANCE();

    // Buscar instance_id do banco
    const { data: instanceData } = await admin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name_evolution", instanceName)
      .single();

    const instanceId = instanceData?.id ?? null;
    if (!instanceId) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    }

    // Buscar chats da Evolution
    let chats: Array<{ id?: string; remoteJid?: string; name?: string; pushName?: string }> = [];
    try {
      const rawChats = await evolutionClient.getChats(instanceName);
      chats = (Array.isArray(rawChats) ? rawChats : []).map((c) => ({
        id: c.id,
        remoteJid: (c as unknown as Record<string, string>).remoteJid ?? c.id,
        name: c.name,
        pushName: (c as unknown as Record<string, string>).pushName,
      }));
    } catch (err) {
      console.error("[Poll] Error fetching chats:", err);
      return NextResponse.json({ error: "Erro ao buscar chats" }, { status: 500 });
    }

    // Filtrar apenas conversas privadas (não grupos, não broadcasts)
    const privateChats = chats.filter((c) => {
      const jid = c.remoteJid || c.id || "";
      return jid.endsWith("@s.whatsapp.net") && jid !== "status@broadcast";
    });

    let newMessages = 0;
    let processed = 0;

    for (const chat of privateChats.slice(0, 30)) {
      const remoteJid = chat.remoteJid || chat.id || "";
      const contactName = chat.pushName || chat.name || remoteJid.split("@")[0];

      // Buscar última mensagem que temos no banco para este contato
      const { data: lastStored } = await admin
        .from("whatsapp_messages")
        .select("message_id_evolution, created_at")
        .eq("remote_jid", remoteJid)
        .eq("instance_id", instanceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Buscar mensagens recentes da Evolution para este chat
      let messages: Array<{
        key: { id: string; fromMe: boolean; remoteJid: string };
        message?: { conversation?: string; extendedTextMessage?: { text?: string }; imageMessage?: { caption?: string } };
        pushName?: string;
        messageTimestamp?: number | string;
        messageType?: string;
      }> = [];

      try {
        const raw = await fetch(
          `${process.env.EVOLUTION_API_BASE}/chat/findMessages/${instanceName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EVOLUTION_API_KEY || "",
            },
            body: JSON.stringify({
              where: { key: { remoteJid } },
              limit: 10,
            }),
          }
        );
        const rawText = await raw.text();
        // Clean control characters that Evolution sometimes includes
        const cleaned = rawText.replace(/[\x00-\x1F\x7F]/g, (ch) =>
          ch === "\n" || ch === "\r" || ch === "\t" ? ch : ""
        );
        try {
          const parsed = JSON.parse(cleaned);
          messages = parsed?.messages?.records || parsed?.records || [];
        } catch {
          // Fallback: try to extract with relaxed parsing
          messages = [];
        }
      } catch {
        continue;
      }

      if (!messages.length) continue;

      for (const msg of messages) {
        const messageId = msg.key?.id;
        if (!messageId) continue;

        // Check if we already have this message
        if (lastStored?.message_id_evolution === messageId) break; // Already processed from here

        const { data: existing } = await admin
          .from("whatsapp_messages")
          .select("id")
          .eq("message_id_evolution", messageId)
          .maybeSingle();

        if (existing) continue; // Already stored

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
              contact_name: contactName,
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

        // ── Admin respondeu pelo celular → pausar IA ──
        if (fromMe) {
          await admin
            .from("whatsapp_conversations")
            .update({ ai_paused: true, updated_at: new Date().toISOString() })
            .eq("id", convData?.id);
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

          // Trigger AI reply (async)
          triggerAIReply(admin, remoteJid, instanceName, text, convData?.id).catch(console.error);
        }
      }
      processed++;
    }

    return NextResponse.json({
      ok: true,
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

  const reply = await generateAIReply(messages, settings);
  if (!reply) return;

  const evolutionClient = getEvolutionClient();
  if (!evolutionClient) return;

  await evolutionClient.sendMessage(instanceName, remoteJid.split("@")[0], reply);

  const { data: instanceData } = await admin
    .from("whatsapp_instances")
    .select("id")
    .eq("instance_name_evolution", instanceName)
    .single();

  await admin.from("whatsapp_messages").insert({
    instance_id: instanceData?.id ?? null,
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
    .update({
      last_message: reply.slice(0, 200),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("remote_jid", remoteJid);
}
