"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Copy, Trash2, Loader2 } from "lucide-react";

type Asset = {
  id: string;
  url: string;
  alt_text: string;
  mime: string;
  tamanho: number;
  created_at: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    const supabase = createClient();
    const { data } = await supabase
      .from("media_assets")
      .select("id, url, alt_text, mime, tamanho, created_at")
      .order("created_at", { ascending: false });
    setAssets((data as Asset[]) ?? []);
    setLoading(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      await fetchAssets();
    } else {
      const d = await res.json();
      alert(d.error ?? "Erro ao fazer upload.");
    }
    setUploading(false);
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Excluir "${asset.alt_text}"?`)) return;
    const supabase = createClient();
    await supabase.from("media_assets").delete().eq("id", asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EDF2F7]">Mídia</h1>
          <p className="mt-1 text-sm text-[#7A8BA8]">{assets.length} arquivo{assets.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E06E00] disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#7A8BA8]">Carregando...</div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1E2D45] py-16 text-center text-sm text-[#7A8BA8]">
          Nenhum arquivo ainda. Faça seu primeiro upload.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-[#1E2D45] bg-[#0D1526]"
            >
              <img
                src={asset.url}
                alt={asset.alt_text}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs font-medium text-white">{asset.alt_text}</p>
                <p className="text-xs text-white/60">{formatBytes(asset.tamanho)}</p>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => copyUrl(asset.url)}
                    className="flex-1 rounded bg-white/15 px-2 py-1 text-xs text-white transition hover:bg-white/25"
                    title="Copiar URL"
                  >
                    {copied === asset.url ? "Copiado!" : <Copy className="mx-auto h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/40"
                    title="Excluir"
                  >
                    <Trash2 className="mx-auto h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
