import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const admin = createAdminClient();
    const instanceName = EVOLUTION_INSTANCE();

    // Get or create instance record
    let { data: instance } = await admin
      .from("whatsapp_instances")
      .select("*")
      .eq("instance_name_evolution", instanceName)
      .single();

    if (!instance) {
      const { data: newInstance } = await admin
        .from("whatsapp_instances")
        .insert({ nome: "Principal", instance_name_evolution: instanceName, status: "desconectado", ativa: true })
        .select()
        .single();
      instance = newInstance;
    }

    // Get live status from Evolution
    const evolutionClient = getEvolutionClient();
    let liveStatus = instance?.status ?? "desconectado";
    let qrcodeBase64 = instance?.qrcode_url ?? null;

    if (evolutionClient) {
      try {
        const statusRes = await evolutionClient.getInstanceStatus(instanceName);
        liveStatus = statusRes.instance?.state === "open" ? "conectado" : statusRes.instance?.state ?? liveStatus;

        if (liveStatus !== "conectado") {
          const qrRes = await evolutionClient.getQRCode(instanceName);
          qrcodeBase64 = qrRes?.qrcode?.base64 ?? qrcodeBase64;
        }
      } catch {
        // Evolution API may not respond — use DB values
      }
    }

    return NextResponse.json({ instance: { ...instance, status: liveStatus, qrcode_url: qrcodeBase64 } });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
