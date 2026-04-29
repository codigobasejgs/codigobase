import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCaption } from "@/lib/ai/caption";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { imageUrl } = await request.json();
    if (!imageUrl) return NextResponse.json({ error: "Imagem obrigatória" }, { status: 400 });

    const admin = createAdminClient();
    const { data: settings } = await admin.from("ai_settings").select("*").limit(1).single();
    if (!settings?.api_key) return NextResponse.json({ error: "API Key da IA não configurada" }, { status: 400 });

    const caption = await generateCaption(imageUrl, settings);
    return NextResponse.json({ caption });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar legenda";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
