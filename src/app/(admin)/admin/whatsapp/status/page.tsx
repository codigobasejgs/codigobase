"use client";

import { useEffect, useState } from "react";
import { Clock, ImageIcon, Loader2, Sparkles, Trash2, Upload, Video } from "lucide-react";

type StatusPost = { id: string; midia_url: string | null; legenda: string; agendado_para: string | null; publicado_em: string | null; status: string; created_at: string };

export default function WhatsAppStatusPage() {
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [tipo, setTipo] = useState<"text" | "image" | "video">("text");
  const [conteudo, setConteudo] = useState("");
  const [legenda, setLegenda] = useState("");
  const [midiaUrl, setMidiaUrl] = useState("");
  const [agendadoPara, setAgendadoPara] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [captioning, setCaptioning] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/whatsapp/status");
    const data = await res.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setMidiaUrl(data.url);
    setUploading(false);
  }

  async function generateCaption() {
    if (!midiaUrl) return;
    setCaptioning(true);
    const res = await fetch("/api/ai/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: midiaUrl }),
    });
    const data = await res.json();
    if (data.caption) setLegenda(data.caption);
    else alert(data.error ?? "Erro ao gerar legenda");
    setCaptioning(false);
  }

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/admin/whatsapp/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, conteudo, legenda, midia_url: midiaUrl, agendado_para: agendadoPara || null }),
    });
    if (res.ok) {
      setConteudo(""); setLegenda(""); setMidiaUrl(""); setAgendadoPara("");
      await load();
    } else {
      const data = await res.json();
      alert(data.error ?? "Erro ao salvar status");
    }
    setLoading(false);
  }

  async function remove(id: string) {
    if (!confirm("Cancelar este status pendente?")) return;
    await fetch(`/api/admin/whatsapp/status/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#EDF2F7]">WhatsApp Status</h1>
        <p className="mt-1 text-sm text-[#7A8BA8]">Publique agora ou agende posts no status.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5">
          <h2 className="mb-4 font-semibold text-[#EDF2F7]">Novo status</h2>

          <div className="mb-4 flex gap-2">
            {(["text", "image", "video"] as const).map((t) => (
              <button key={t} onClick={() => setTipo(t)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${tipo === t ? "bg-[#00C8E8]/15 text-[#00C8E8]" : "text-[#7A8BA8] hover:bg-[#111827]"}`}>
                {t === "text" ? <Clock className="h-4 w-4" /> : t === "image" ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                {t === "text" ? "Texto" : t === "image" ? "Imagem" : "Vídeo"}
              </button>
            ))}
          </div>

          {tipo === "text" ? (
            <textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={4} placeholder="Texto do status..." className="w-full resize-none rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] focus:border-[#00C8E8] focus:outline-none" />
          ) : (
            <div className="space-y-3">
              {midiaUrl && (tipo === "image" ? <img src={midiaUrl} className="max-h-56 w-full rounded-lg object-cover" alt="preview" /> : <video src={midiaUrl} controls className="max-h-56 w-full rounded-lg" />)}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#243352] px-4 py-6 text-sm text-[#7A8BA8] hover:border-[#00C8E8] hover:text-[#00C8E8]">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar arquivo"}
                <input type="file" accept={tipo === "image" ? "image/*" : "video/*"} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              </label>
              {tipo === "image" && midiaUrl && (
                <button onClick={generateCaption} disabled={captioning} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00C8E8]/15 px-4 py-2 text-sm font-semibold text-[#00C8E8] disabled:opacity-50">
                  {captioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Gerar legenda por IA
                </button>
              )}
              <textarea value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={3} placeholder="Legenda..." className="w-full resize-none rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] focus:border-[#00C8E8] focus:outline-none" />
            </div>
          )}

          <div className="mt-4">
            <label className="mb-1 block text-sm text-[#A0AEC0]">Agendar para (opcional)</label>
            <input type="datetime-local" value={agendadoPara} onChange={(e) => setAgendadoPara(e.target.value)} className="w-full rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] focus:border-[#00C8E8] focus:outline-none" />
          </div>

          <button onClick={submit} disabled={loading || (tipo === "text" ? !conteudo.trim() : !midiaUrl)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E06E00] disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {agendadoPara ? "Agendar" : "Publicar agora"}
          </button>
        </div>

        <div className="space-y-3">
          {posts.length === 0 ? <p className="text-sm text-[#7A8BA8]">Nenhum status criado.</p> : posts.map((post) => (
            <div key={post.id} className="flex items-center gap-4 rounded-xl border border-[#1E2D45] bg-[#0D1526] p-4">
              {post.midia_url ? <img src={post.midia_url} className="h-16 w-16 rounded-lg object-cover" alt="" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#111827] text-xs text-[#7A8BA8]">Texto</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#EDF2F7]">{post.legenda || "Sem legenda"}</p>
                <p className="mt-1 text-xs text-[#7A8BA8]">{post.agendado_para ? `Agendado: ${new Date(post.agendado_para).toLocaleString("pt-BR")}` : post.publicado_em ? `Publicado: ${new Date(post.publicado_em).toLocaleString("pt-BR")}` : "Imediato"}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${post.status === "publicado" ? "bg-emerald-500/15 text-emerald-400" : post.status === "erro" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"}`}>{post.status}</span>
              {post.status === "pendente" && <button onClick={() => remove(post.id)} className="rounded p-2 text-[#7A8BA8] hover:bg-red-500/15 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
