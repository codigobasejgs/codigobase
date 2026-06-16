import React, { useEffect, useState } from 'react';
import { CalendarClock, ImagePlus, RefreshCw, Send, Trash2, UploadCloud } from 'lucide-react';
import { supabase, supabaseFunctionsUrl } from './lib/supabaseClient';

type StatusPost = {
  id: string;
  title: string | null;
  caption: string | null;
  media_url: string | null;
  media_path: string | null;
  media_mime_type: string | null;
  scheduled_at: string;
  repeat_type: 'once' | 'daily' | 'weekly';
  status: 'scheduled' | 'publishing' | 'published' | 'error' | 'cancelled';
  published_at: string | null;
  error_message: string | null;
  created_at: string;
};

const toLocalInputValue = (date = new Date(Date.now() + 10 * 60 * 1000)) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function StatusScheduler({ session }: { session: any }) {
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [title, setTitle] = useState('Status Código Base');
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue());
  const [repeatType, setRepeatType] = useState<'once' | 'daily' | 'weekly'>('once');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadPosts() {
    const { data } = await supabase
      .from('cb_whatsapp_status_posts')
      .select('*')
      .order('scheduled_at', { ascending: false })
      .limit(60);
    setPosts(data || []);
  }

  useEffect(() => { loadPosts(); }, []);

  async function uploadMedia() {
    if (!file) return { media_url: null, media_path: null, media_mime_type: null };
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = `${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('whatsapp-status-media').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('whatsapp-status-media').getPublicUrl(path);
    return { media_url: data.publicUrl, media_path: path, media_mime_type: file.type };
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice('');
    try {
      const media = await uploadMedia();
      const scheduledIso = new Date(scheduledAt).toISOString();
      const { error } = await supabase.from('cb_whatsapp_status_posts').insert({
        title,
        caption,
        scheduled_at: scheduledIso,
        repeat_type: repeatType,
        timezone: 'America/Sao_Paulo',
        created_by: session?.user?.id,
        ...media,
      });
      if (error) throw error;
      setNotice('Status agendado com sucesso.');
      setCaption('');
      setFile(null);
      setScheduledAt(toLocalInputValue());
      await loadPosts();
    } catch (err: any) {
      setNotice(`Erro: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  async function publishNow(post: StatusPost) {
    setLoading(true);
    setNotice('');
    try {
      const res = await fetch(`${supabaseFunctionsUrl}/publish-status-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id: post.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao publicar');
      setNotice('Status enviado para publicação.');
      await loadPosts();
    } catch (err: any) {
      setNotice(`Erro ao publicar: ${err.message || err}`);
      await loadPosts();
    } finally {
      setLoading(false);
    }
  }

  async function cancelPost(post: StatusPost) {
    await supabase.from('cb_whatsapp_status_posts').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', post.id);
    await loadPosts();
  }

  const badge = (status: string) => ({
    scheduled: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/20',
    publishing: 'bg-orange-400/10 text-orange-200 border-orange-400/20',
    published: 'bg-green-400/10 text-green-200 border-green-400/20',
    error: 'bg-red-400/10 text-red-200 border-red-400/20',
    cancelled: 'bg-gray-400/10 text-gray-200 border-gray-400/20',
  }[status] || 'bg-white/10 text-white border-white/10');

  return (
    <section className="rounded-3xl border border-orange-400/20 bg-orange-400/[0.03] p-6 shadow-[0_0_50px_rgba(255,122,0,0.08)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><CalendarClock className="text-orange-300" /> Status WhatsApp agendado</h2>
          <p className="mt-1 text-sm text-gray-400">Anexe imagem/vídeo, escolha data/horário e publique nos status via Evolution API.</p>
        </div>
        <button onClick={loadPosts} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={16} className="inline mr-2" />Atualizar</button>
      </div>

      <form onSubmit={createPost} className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Título interno</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-orange-400" /></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Data e horário</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-orange-400" /></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Repetição</span><select value={repeatType} onChange={(e) => setRepeatType(e.target.value as any)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-orange-400"><option value="once">Uma vez</option><option value="daily">Todos os dias</option><option value="weekly">Semanal</option></select></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Imagem ou vídeo</span><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#05070D] px-3 py-3"><ImagePlus size={18} className="text-orange-300" /><input type="file" accept="image/png,image/jpeg,image/webp,video/mp4" onChange={(e) => setFile(e.target.files?.[0] || null)} className="min-w-0 text-sm" /></div></label>
        <label className="space-y-2 lg:col-span-2"><span className="text-sm font-bold text-gray-200">Legenda do status</span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[110px] w-full rounded-xl border border-white/10 bg-[#05070D] p-3 outline-none focus:border-orange-400" placeholder="Texto que acompanha a imagem/vídeo no status..." /></label>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button disabled={loading || (!caption.trim() && !file)} className="rounded-xl bg-orange-400 px-5 py-3 font-bold text-black disabled:opacity-50"><UploadCloud size={18} className="inline mr-2" />Agendar status</button>{notice && <p className="text-sm text-orange-100">{notice}</p>}</div>
      </form>

      <div className="mt-6 grid gap-3">
        {posts.map((post) => (
          <div key={post.id} className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[88px_1fr_auto]">
            <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5 grid place-items-center">
              {post.media_url ? (post.media_mime_type?.startsWith('video/') ? <video src={post.media_url} className="h-full w-full object-cover" /> : <img src={post.media_url} className="h-full w-full object-cover" />) : <ImagePlus className="text-gray-500" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{post.title || 'Status'}</h3><span className={`rounded-full border px-2 py-0.5 text-xs ${badge(post.status)}`}>{post.status}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-gray-300">{post.repeat_type}</span></div>
              <p className="mt-1 text-sm text-gray-300 line-clamp-2">{post.caption || 'Sem legenda'}</p>
              <p className="mt-2 text-xs text-gray-500">Agendado: {new Date(post.scheduled_at).toLocaleString('pt-BR')} {post.published_at ? `• Publicado: ${new Date(post.published_at).toLocaleString('pt-BR')}` : ''}</p>
              {post.error_message && <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">{post.error_message}</p>}
            </div>
            <div className="flex items-center gap-2 md:flex-col md:items-end">
              <button disabled={loading || !['scheduled','error'].includes(post.status)} onClick={() => publishNow(post)} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-40"><Send size={15} className="inline mr-1" />Publicar</button>
              <button disabled={post.status === 'published'} onClick={() => cancelPost(post)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100 disabled:opacity-40"><Trash2 size={15} className="inline mr-1" />Cancelar</button>
            </div>
          </div>
        ))}
        {!posts.length && <p className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-500">Nenhum status agendado ainda.</p>}
      </div>
    </section>
  );
}
