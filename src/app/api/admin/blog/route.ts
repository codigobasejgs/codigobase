import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, titulo, slug, status, published_at, created_at, categoria_id, blog_categories(nome)")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();
    const { titulo, slug, resumo, conteudo_json, conteudo_html, cover_url, categoria_id, tags, reading_time, seo_title, seo_description, status } = body;

    if (!titulo || !slug) {
      return NextResponse.json({ error: "Título e slug são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        titulo,
        slug,
        resumo: resumo ?? "",
        conteudo_json: conteudo_json ?? {},
        conteudo_html: conteudo_html ?? "",
        cover_url: cover_url ?? "",
        categoria_id: categoria_id ?? null,
        tags: tags ?? [],
        reading_time: reading_time ?? 1,
        seo_title: seo_title ?? titulo,
        seo_description: seo_description ?? resumo ?? "",
        autor_id: user.id,
        status: status ?? "rascunho",
        published_at: status === "publicado" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
