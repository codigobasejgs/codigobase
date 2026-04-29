import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ jid: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { jid } = await params;
    const remoteJid = decodeURIComponent(jid);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("whatsapp_messages")
      .select("id, direcao, conteudo, tipo, created_at, status, contact_name")
      .eq("remote_jid", remoteJid)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mark as read
    await admin
      .from("whatsapp_conversations")
      .update({ unread_count: 0, updated_at: new Date().toISOString() })
      .eq("remote_jid", remoteJid);

    return NextResponse.json({ messages: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
