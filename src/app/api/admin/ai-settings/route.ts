import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAIReply } from "@/lib/ai/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const admin = createAdminClient();
    const { data } = await admin.from("ai_settings").select("*").limit(1).single();
    if (data?.api_key) data.api_key = "********";
    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const admin = createAdminClient();
    const { data: current } = await admin.from("ai_settings").select("id, api_key").limit(1).single();

    const update = {
      provider: body.provider,
      api_key: body.api_key && body.api_key !== "********" ? body.api_key : current?.api_key,
      model: body.model,
      system_prompt: body.system_prompt,
      auto_reply: body.auto_reply,
      auto_reply_delay_ms: body.auto_reply_delay_ms,
      max_tokens: body.max_tokens,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("ai_settings")
      .upsert({ id: current?.id, ...update })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data?.api_key) data.api_key = "********";
    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { message } = await request.json();
    const admin = createAdminClient();
    const { data: settings } = await admin.from("ai_settings").select("*").limit(1).single();
    if (!settings?.api_key) return NextResponse.json({ error: "API Key não configurada" }, { status: 400 });

    const reply = await generateAIReply([{ role: "user", content: message ?? "Olá" }], settings);
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao testar IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
