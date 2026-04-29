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

    await evolutionClient.sendMessage(instanceName, phoneNumber, text);

    // Store in DB
    const admin = createAdminClient();
    const { data: instance } = await admin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name_evolution", instanceName)
      .single();

    await admin.from("whatsapp_messages").insert({
      instance_id: instance?.id ?? null,
      remote_jid: remoteJid,
      direcao: "out",
      conteudo: text,
      tipo: "texto",
      status: "entregue",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await admin
      .from("whatsapp_conversations")
      .update({ last_message: text.slice(0, 200), last_message_at: new Date().toISOString(), unread_count: 0, updated_at: new Date().toISOString() })
      .eq("remote_jid", remoteJid);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
