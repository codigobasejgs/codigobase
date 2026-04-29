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

    // Normalize QR code response — Evolution v2 returns different shapes
    const raw = res as Record<string, unknown>;
    let base64 = (res?.qrcode?.base64 ?? raw?.base64 ?? null) as string | null;

    if (base64 && !base64.startsWith("data:")) {
      base64 = `data:image/png;base64,${base64}`;
    }

    return NextResponse.json({ qrcode: base64 ? { base64 } : null, code: res?.qrcode?.code ?? raw?.code ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao conectar";
    console.error("Connect error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
