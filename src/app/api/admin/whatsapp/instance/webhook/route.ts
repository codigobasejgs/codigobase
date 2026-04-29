import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEvolutionClient, EVOLUTION_INSTANCE } from "@/lib/evolution/client";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const evolutionClient = getEvolutionClient();
    if (!evolutionClient) return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 });

    const { webhookUrl } = await request.json().catch(() => ({}));

    // Build webhook URL from request origin or env
    let url = webhookUrl;
    if (!url) {
      const headersList = await headers();
      const host = headersList.get("host") || "www.codigobase.com.br";
      const proto = headersList.get("x-forwarded-proto") || "https";
      url = `${proto}://${host}/api/webhooks/evolution`;
    }

    const instanceName = EVOLUTION_INSTANCE();
    await evolutionClient.configureWebhook(instanceName, url, [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED",
      "SEND_MESSAGE",
    ]);

    return NextResponse.json({ ok: true, webhookUrl: url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
