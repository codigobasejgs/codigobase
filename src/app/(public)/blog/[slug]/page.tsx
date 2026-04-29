import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

type Params = { params: Promise<{ slug: string }> };

type Post = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  cover_url: string;
  conteudo_html: string;
  published_at: string;
  reading_time: number;
  seo_title: string;
  seo_description: string;
  tags: string[];
  blog_categories: { nome: string }[] | null;
};

async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, titulo, slug, resumo, cover_url, conteudo_html, published_at, reading_time, seo_title, seo_description, tags, blog_categories(nome)")
    .eq("slug", slug)
    .eq("status", "publicado")
    .lte("published_at", new Date().toISOString())
    .single();
  return (data as unknown as Post) ?? null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  return {
    title: post.seo_title || post.titulo,
    description: post.seo_description || post.resumo,
    openGraph: {
      title: post.seo_title || post.titulo,
      description: post.seo_description || post.resumo,
      images: post.cover_url ? [{ url: post.cover_url }] : [],
      type: "article",
      publishedTime: post.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.titulo,
      description: post.seo_description || post.resumo,
      images: post.cover_url ? [post.cover_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#050A14] py-16">
      <div className="mx-auto max-w-3xl px-4">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#7A8BA8] transition hover:text-[#00C8E8]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao blog
        </Link>

        {post.blog_categories?.[0]?.nome && (
          <span className="mb-4 block text-xs font-semibold uppercase tracking-wider text-[#00C8E8]">
            {post.blog_categories[0].nome}
          </span>
        )}

        <h1 className="text-3xl font-bold leading-tight text-[#EDF2F7] md:text-4xl">
          {post.titulo}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#7A8BA8]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(post.published_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.reading_time} min de leitura
          </span>
        </div>

        {post.cover_url && (
          <img
            src={post.cover_url}
            alt={post.titulo}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        <article
          className="prose-blog mt-10"
          dangerouslySetInnerHTML={{ __html: post.conteudo_html }}
        />

        {post.tags?.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#0D1526] px-3 py-1 text-xs text-[#7A8BA8] border border-[#1E2D45]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-[#1E2D45] bg-[#0D1526] p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-[#EDF2F7]">
            Precisa de tecnologia sob medida?
          </h2>
          <p className="mb-6 text-[#7A8BA8]">
            Desenvolvemos software, automações e sistemas que transformam o seu negócio.
          </p>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF7A00] px-6 py-3 font-semibold text-white transition hover:bg-[#E06E00]"
          >
            Fale com a Código Base
          </Link>
        </div>
      </div>
    </main>
  );
}
