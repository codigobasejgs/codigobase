import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const evolutionClient = getEvolutionClient();
  if (!evolutionClient) return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });

  const { data: posts } = await admin
    .from("whatsapp_status_posts")
    .select("*")
    .eq("status", "pendente")
    .lte("agendado_para", new Date().toISOString())
    .limit(10);

  const results = [];

  for (const post of posts ?? []) {
    await admin.from("whatsapp_status_posts").update({ status: "publicando" }).eq("id", post.id);

    try {
      const res = await evolutionClient.sendStatus(EVOLUTION_INSTANCE(), {
        type: post.midia_url ? (post.midia_url.match(/\.(mp4|mov|webm)$/i) ? "video" : "image") : "text",
        content: post.midia_url || post.legenda,
        caption: post.legenda,
      });

      await admin.from("whatsapp_status_posts").update({
        status: "publicado",
        publicado_em: new Date().toISOString(),
        payload_response: res,
      }).eq("id", post.id);

      results.push({ id: post.id, ok: true });
    } catch (err: unknown) {
      await admin.from("whatsapp_status_posts").update({
        status: "erro",
        payload_response: { error: err instanceof Error ? err.message : "Erro" },
      }).eq("id", post.id);
      results.push({ id: post.id, ok: false });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
