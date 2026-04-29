"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

type Post = {
  id: string;
  titulo: string;
  slug: string;
  status: "rascunho" | "publicado";
  published_at: string | null;
  created_at: string;
  categoria_id: string | null;
  blog_categories: { nome: string }[] | null;
};

const STATUS_LABELS: Record<string, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
};

const STATUS_COLORS: Record<string, string> = {
  publicado: "bg-emerald-500/15 text-emerald-400",
  rascunho: "bg-yellow-500/15 text-yellow-400",
};

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "publicado" | "rascunho">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("id, titulo, slug, status, published_at, created_at, categoria_id, blog_categories(nome)")
      .order("created_at", { ascending: false });
    setPosts((data as unknown as Post[]) ?? []);
    setLoading(false);
  }

  async function handleDelete(id: string, titulo: string) {
    if (!confirm(`Excluir "${titulo}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Erro ao excluir o post.");
    }
    setDeleting(null);
  }

  const filtered = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EDF2F7]">Blog</h1>
          <p className="mt-1 text-sm text-[#7A8BA8]">{posts.length} post{posts.length !== 1 ? "s" : ""} no total</p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="flex items-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E06E00]"
        >
          <Plus className="h-4 w-4" />
          Novo post
        </Link>
      </div>

      <div className="flex gap-2">
        {(["all", "publicado", "rascunho"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === s
                ? "bg-[#00C8E8]/15 text-[#00C8E8]"
                : "text-[#7A8BA8] hover:bg-[#1A2236] hover:text-[#EDF2F7]"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1E2D45] bg-[#0D1526]">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#7A8BA8]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#7A8BA8]">Nenhum post encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2D45] text-left text-xs text-[#7A8BA8]">
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]">
              {filtered.map((post) => (
                <tr key={post.id} className="transition hover:bg-[#111827]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#EDF2F7]">{post.titulo}</span>
                    <div className="mt-0.5 text-xs text-[#7A8BA8]">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-[#7A8BA8]">
                    {post.blog_categories?.[0]?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status]}`}>
                      {STATUS_LABELS[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#7A8BA8]">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("pt-BR")
                      : new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.status === "publicado" && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1.5 text-[#7A8BA8] transition hover:bg-[#1A2236] hover:text-[#EDF2F7]"
                          title="Ver publicado"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="rounded p-1.5 text-[#7A8BA8] transition hover:bg-[#1A2236] hover:text-[#EDF2F7]"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, post.titulo)}
                        disabled={deleting === post.id}
                        className="rounded p-1.5 text-[#7A8BA8] transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
