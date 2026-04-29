"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type JSONContent } from "@tiptap/react";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Loader2, Upload } from "lucide-react";

type Category = { id: string; nome: string };

type PostFormData = {
  titulo: string;
  slug: string;
  resumo: string;
  conteudo_json: JSONContent;
  conteudo_html: string;
  cover_url: string;
  categoria_id: string;
  tags: string;
  reading_time: number;
  seo_title: string;
  seo_description: string;
  status: "rascunho" | "publicado";
};

type Props = {
  initialData?: Partial<PostFormData> & { id?: string };
  mode: "novo" | "editar";
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function PostForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [form, setForm] = useState<PostFormData>({
    titulo: initialData?.titulo ?? "",
    slug: initialData?.slug ?? "",
    resumo: initialData?.resumo ?? "",
    conteudo_json: initialData?.conteudo_json ?? {},
    conteudo_html: initialData?.conteudo_html ?? "",
    cover_url: initialData?.cover_url ?? "",
    categoria_id: initialData?.categoria_id ?? "",
    tags: Array.isArray(initialData?.tags)
      ? (initialData.tags as string[]).join(", ")
      : (initialData?.tags as string) ?? "",
    reading_time: initialData?.reading_time ?? 1,
    seo_title: initialData?.seo_title ?? "",
    seo_description: initialData?.seo_description ?? "",
    status: initialData?.status ?? "rascunho",
  });

  useEffect(() => {
    fetch("/api/admin/blog/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const set = useCallback(<K extends keyof PostFormData>(key: K, value: PostFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function handleTituloChange(value: string) {
    set("titulo", value);
    if (!slugManuallyEdited) {
      set("slug", slugify(value));
    }
    if (!form.seo_title) {
      set("seo_title", value);
    }
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      set("cover_url", url);
    }
    setCoverUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      seo_title: form.seo_title || form.titulo,
      seo_description: form.seo_description || form.resumo,
    };

    const url =
      mode === "novo" ? "/api/admin/blog" : `/api/admin/blog/${initialData?.id}`;
    const method = mode === "novo" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar.");
      setSaving(false);
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] placeholder-[#4A5568] focus:border-[#00C8E8] focus:outline-none";
  const labelClass = "mb-1.5 block text-sm font-medium text-[#A0AEC0]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#EDF2F7]">
          {mode === "novo" ? "Novo post" : "Editar post"}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="rounded-lg px-4 py-2 text-sm text-[#7A8BA8] transition hover:bg-[#1A2236] hover:text-[#EDF2F7]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E06E00] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          <div>
            <label className={labelClass}>Título *</label>
            <input
              className={inputClass}
              value={form.titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              placeholder="Título do post"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Slug *</label>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                set("slug", e.target.value);
              }}
              placeholder="url-do-post"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Resumo</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              value={form.resumo}
              onChange={(e) => set("resumo", e.target.value)}
              placeholder="Breve descrição do post..."
            />
          </div>

          <div>
            <label className={labelClass}>Conteúdo</label>
            <RichTextEditor
              value={Object.keys(form.conteudo_json).length ? form.conteudo_json : undefined}
              onChange={(json, html) => {
                set("conteudo_json", json);
                set("conteudo_html", html);
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-4">
            <h3 className="mb-4 text-sm font-semibold text-[#EDF2F7]">Publicação</h3>

            <div className="mb-4">
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as PostFormData["status"])}
              >
                <option value="rascunho">Rascunho</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Categoria</label>
              <select
                className={inputClass}
                value={form.categoria_id}
                onChange={(e) => set("categoria_id", e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-4">
            <h3 className="mb-4 text-sm font-semibold text-[#EDF2F7]">Cover</h3>
            {form.cover_url && (
              <img
                src={form.cover_url}
                alt="Cover"
                className="mb-3 h-32 w-full rounded-lg object-cover"
              />
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#243352] px-3 py-4 text-sm text-[#7A8BA8] transition hover:border-[#00C8E8] hover:text-[#00C8E8]">
              {coverUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {coverUploading ? "Enviando..." : "Escolher imagem"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {form.cover_url && (
              <button
                type="button"
                onClick={() => set("cover_url", "")}
                className="mt-2 w-full text-center text-xs text-[#7A8BA8] hover:text-red-400"
              >
                Remover cover
              </button>
            )}
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-4">
            <h3 className="mb-4 text-sm font-semibold text-[#EDF2F7]">Detalhes</h3>

            <div className="mb-4">
              <label className={labelClass}>Tags</label>
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="react, nextjs, web"
              />
              <p className="mt-1 text-xs text-[#4A5568]">Separadas por vírgula</p>
            </div>

            <div>
              <label className={labelClass}>Tempo de leitura (min)</label>
              <input
                type="number"
                min={1}
                max={60}
                className={inputClass}
                value={form.reading_time}
                onChange={(e) => set("reading_time", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-4">
            <h3 className="mb-4 text-sm font-semibold text-[#EDF2F7]">SEO</h3>

            <div className="mb-4">
              <label className={labelClass}>Título SEO</label>
              <input
                className={inputClass}
                value={form.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
                placeholder={form.titulo || "Título para mecanismos de busca"}
                maxLength={60}
              />
            </div>

            <div>
              <label className={labelClass}>Descrição SEO</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={form.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
                placeholder={form.resumo || "Descrição para mecanismos de busca"}
                maxLength={160}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
