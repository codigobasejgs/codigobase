import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";
import { generateAIReply } from "@/lib/ai/client";
import type { AISettings, ChatMessage } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    const admin = createAdminClient();

    if (event === "QRCODE_UPDATED") {
      const qrBase64 = data?.qrcode?.base64;
      if (qrBase64) {
        await admin
          .from("whatsapp_instances")
          .update({ qrcode_url: qrBase64, status: "aguardando_qr", updated_at: new Date().toISOString() })
          .eq("instance_name_evolution", data.instance ?? EVOLUTION_INSTANCE());
      }
    }

    if (event === "CONNECTION_UPDATE") {
      const state = data?.state ?? data?.connectionStatus;
      const statusMap: Record<string, string> = {
        open: "conectado",
        close: "desconectado",
        connecting: "conectando",
      };
      await admin
        .from("whatsapp_instances")
        .update({ status: statusMap[state] ?? state, updated_at: new Date().toISOString() })
        .eq("instance_name_evolution", data.instance ?? EVOLUTION_INSTANCE());
    }

    if (event === "MESSAGES_UPSERT") {
      const messages = Array.isArray(data?.messages) ? data.messages : [data?.message].filter(Boolean);

      for (const msg of messages) {
        const remoteJid: string = msg?.key?.remoteJid ?? "";
        const fromMe: boolean = msg?.key?.fromMe ?? false;
        const messageId: string = msg?.key?.id ?? "";
        const instanceName: string = data?.instance ?? EVOLUTION_INSTANCE();
        const pushName: string = msg?.pushName ?? "";

        const text: string =
          msg?.message?.conversation ??
          msg?.message?.extendedTextMessage?.text ??
          msg?.message?.imageMessage?.caption ??
          "";

        if (!remoteJid || remoteJid.endsWith("@g.us")) continue; // skip groups for now

        // Upsert conversation
        const { data: convData } = await admin
          .from("whatsapp_conversations")
          .upsert(
            {
              instance_id: await getInstanceId(admin, instanceName),
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

        // Store message
        await admin.from("whatsapp_messages").insert({
          instance_id: await getInstanceId(admin, instanceName),
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

        // AI auto-reply (only for incoming, non-paused conversations)
        if (!fromMe && text && !(convData?.ai_paused)) {
          triggerAIReply(admin, remoteJid, instanceName, text).catch(console.error);
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
  incomingText: string
) {
  const { data: aiConfig } = await admin
    .from("ai_settings")
    .select("*")
    .eq("auto_reply", true)
    .single();

  if (!aiConfig || !aiConfig.api_key) return;

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

  const reply = await generateAIReply(messages, settings);
  if (!reply) return;

  const evolutionClient = getEvolutionClient();
  if (!evolutionClient) return;

  await evolutionClient.sendMessage(instanceName, remoteJid.split("@")[0], reply);

  const instanceId = await getInstanceId(admin, instanceName);
  await admin.from("whatsapp_messages").insert({
    instance_id: instanceId,
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
