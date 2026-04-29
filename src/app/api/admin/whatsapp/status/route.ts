import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const admin = createAdminClient();
    const { data } = await admin
      .from("whatsapp_status_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ posts: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { tipo, conteudo, legenda, midia_url, agendado_para, cor } = body;

    const admin = createAdminClient();
    const instanceName = EVOLUTION_INSTANCE();
    const { data: instance } = await admin
      .from("whatsapp_instances")
      .select("id")
      .eq("instance_name_evolution", instanceName)
      .single();

    const isImmediate = !agendado_para || new Date(agendado_para) <= new Date();

    if (isImmediate) {
      const evolutionClient = getEvolutionClient();
      if (!evolutionClient) return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });

      const statusContent = {
        type: tipo as "text" | "image" | "video",
        content: tipo === "text" ? conteudo : midia_url,
        caption: legenda,
        backgroundColor: cor ?? "#000000",
      };

      let payload: Record<string, unknown> = {};
      try {
        const res = await evolutionClient.sendStatus(instanceName, statusContent);
        payload = res as unknown as Record<string, unknown>;
      } catch (e) {
        console.error("Error sending status:", e);
      }

      const { data: post } = await admin
        .from("whatsapp_status_posts")
        .insert({
          instance_id: instance?.id,
          midia_url: midia_url ?? null,
          legenda: legenda ?? conteudo ?? "",
          agendado_para: null,
          publicado_em: new Date().toISOString(),
          status: "publicado",
          payload_response: payload,
        })
        .select()
        .single();

      return NextResponse.json({ post }, { status: 201 });
    }

    // Schedule for later
    const { data: post } = await admin
      .from("whatsapp_status_posts")
      .insert({
        instance_id: instance?.id,
        midia_url: midia_url ?? null,
        legenda: legenda ?? conteudo ?? "",
        agendado_para: new Date(agendado_para).toISOString(),
        status: "pendente",
      })
      .select()
      .single();

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
