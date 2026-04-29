import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const evolutionClient = getEvolutionClient();
    if (!evolutionClient) return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });

    const instanceName = EVOLUTION_INSTANCE();
    const res = await evolutionClient.connectInstance(instanceName);
    return NextResponse.json({ qrcode: res?.qrcode ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao conectar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
