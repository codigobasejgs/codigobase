import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Params = { params: Promise<{ jid: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { jid } = await params;
    const remoteJid = decodeURIComponent(jid);
    const body = await request.json();

    const admin = createAdminClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.ai_paused === "boolean") update.ai_paused = body.ai_paused;
    if (typeof body.unread_count === "number") update.unread_count = body.unread_count;

    const { error } = await admin
      .from("whatsapp_conversations")
      .update(update)
      .eq("remote_jid", remoteJid);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
