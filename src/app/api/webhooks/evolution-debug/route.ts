import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Debug endpoint — salva o payload RAW de qualquer webhook
// Depois de debugar, remover este endpoint
export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    const admin = createAdminClient();

    // Salva o payload raw como uma "mensagem" debug no banco
    await admin.from("whatsapp_messages").insert({
      remote_jid: "debug@webhook.log",
      direcao: "in",
      conteudo: rawText.slice(0, 4000),
      tipo: "debug",
      message_id_evolution: `DEBUG_${Date.now()}`,
      status: "debug",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, logged: true });
  } catch (err) {
    console.error("Debug webhook error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
