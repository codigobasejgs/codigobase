import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { titulo, slug, resumo, conteudo_json, conteudo_html, cover_url, categoria_id, tags, reading_time, seo_title, seo_description, status } = body;

    const { data: existing } = await supabase.from("blog_posts").select("status, published_at").eq("id", id).single();
    const wasPublished = existing?.status === "publicado";
    const isNowPublished = status === "publicado";

    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        titulo,
        slug,
        resumo,
        conteudo_json,
        conteudo_html,
        cover_url,
        categoria_id,
        tags,
        reading_time,
        seo_title,
        seo_description,
        status,
        published_at: isNowPublished && !wasPublished ? new Date().toISOString() : existing?.published_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
