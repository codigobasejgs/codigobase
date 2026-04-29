import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";

type Params = { params: Promise<{ jid: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { jid } = await params;
    const remoteJid = decodeURIComponent(jid);
    const { text } = await request.json();

    if (!text?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

    const evolutionClient = getEvolutionClient();
    if (!evolutionClient) return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });

    const instanceName = EVOLUTION_INSTANCE();
    const phoneNumber = remoteJid.split("@")[0];

    const res = await evolutionClient.sendMessage(instanceName, phoneNumber, text);

    // Store in DB
    const admin = createAdminClient();
    const { data: instance } = await admin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name_evolution", instanceName)
      .single();

    // Salva a mensagem com o message_id da Evolution
    // para que o webhook saiba que essa msg veio do nosso sistema
    const messageId = res?.key?.id ?? null;

    await admin.from("whatsapp_messages").insert({
      instance_id: instance?.id ?? null,
      remote_jid: remoteJid,
      direcao: "out",
      conteudo: text,
      tipo: "texto",
      message_id_evolution: messageId,
      status: "entregue",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // ── REGRA 3: Admin respondeu → pausar IA nessa conversa ──
    await admin
      .from("whatsapp_conversations")
      .update({
        last_message: text.slice(0, 200),
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        ai_paused: true,
        updated_at: new Date().toISOString(),
      })
      .eq("remote_jid", remoteJid);

    return NextResponse.json({ ok: true, ai_paused: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
