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
    let ownerNumber: string | null = instance?.numero ?? null;

    if (evolutionClient) {
      try {
        // Try fetching instance info (includes connection status + owner)
        const instances = await evolutionClient.getInstanceInfo(instanceName);
        const info = Array.isArray(instances) ? instances[0] : instances;

        if (info) {
          const connStatus = info.connectionStatus ?? "";
          liveStatus = connStatus === "open" ? "conectado" : connStatus === "close" ? "desconectado" : connStatus || liveStatus;

          if (info.ownerJid) {
            ownerNumber = info.ownerJid.replace("@s.whatsapp.net", "");
          }
        }
      } catch {
        // Fallback: try connectionState endpoint
        try {
          const statusRes = await evolutionClient.getInstanceStatus(instanceName);
          const state = statusRes.instance?.state;
          liveStatus = state === "open" ? "conectado" : state === "close" ? "desconectado" : state ?? liveStatus;
        } catch {
          // Use DB values
        }
      }

      // Get QR code if not connected
      if (liveStatus !== "conectado") {
        try {
          const qrRes = await evolutionClient.connectInstance(instanceName);
          const raw = qrRes as unknown as Record<string, unknown>;
          const base64 = (qrRes?.qrcode?.base64 ?? (raw?.base64 as string | undefined)) ?? null;
          if (base64) {
            qrcodeBase64 = base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
          }
        } catch {
          // QR not available yet
        }
      }

      // Update DB with live status
      if (instance?.id) {
        await admin
          .from("whatsapp_instances")
          .update({ status: liveStatus, numero: ownerNumber })
          .eq("id", instance.id);
      }
    }

    return NextResponse.json({
      instance: {
        ...instance,
        status: liveStatus,
        qrcode_url: qrcodeBase64,
        numero: ownerNumber,
      },
    });
  } catch (err) {
    console.error("Instance GET error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
