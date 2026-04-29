import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Código Base",
  description: "Artigos sobre tecnologia, desenvolvimento de software e automação de processos.",
};

type Post = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  cover_url: string;
  published_at: string;
  reading_time: number;
  blog_categories: { nome: string }[] | null;
};

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, titulo, slug, resumo, cover_url, published_at, reading_time, blog_categories(nome)")
    .eq("status", "publicado")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  const list = (posts as unknown as Post[]) ?? [];

  return (
    <main className="min-h-screen bg-[#050A14] py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[#EDF2F7] md:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-[#7A8BA8]">
            Insights sobre tecnologia, automação e desenvolvimento sob medida.
          </p>
        </div>

        {list.length === 0 ? (
          <p className="text-center text-[#7A8BA8]">Nenhum post publicado ainda.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#1E2D45] bg-[#0D1526] transition hover:border-[#00C8E8]/40 hover:shadow-lg hover:shadow-[#00C8E8]/5"
              >
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt={post.titulo}
                    className="aspect-video w-full object-cover transition group-hover:brightness-110"
                  />
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-[#0A1628] to-[#1A2D4A]" />
                )}

                <div className="flex flex-1 flex-col p-5">
                  {post.blog_categories?.[0]?.nome && (
                    <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#00C8E8]">
                      {post.blog_categories[0].nome}
                    </span>
                  )}

                  <h2 className="mb-2 text-lg font-bold leading-snug text-[#EDF2F7] transition group-hover:text-white">
                    {post.titulo}
                  </h2>

                  {post.resumo && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm text-[#7A8BA8]">
                      {post.resumo}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[#4A5568]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.published_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.reading_time} min
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
