import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUpload, uploadToStorage } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido" }, { status: 400 });
    }

    const validationError = validateUpload(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToStorage(buffer, file.name, file.type);

    // Registra na tabela de assets
    const admin = createAdminClient();
    await admin.from("media_assets").insert({
      storage_path: url,
      url,
      mime: file.type,
      tamanho: file.size,
      alt_text: file.name.replace(/\.[^.]+$/, ""),
      uploaded_by: user.id,
    });

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 });
  }
}
