import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ImagePlus, Instagram, Loader2, RefreshCw, Send, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { supabase, supabaseFunctionsUrl } from './lib/supabaseClient';

type InstagramAccount = {
  id: string;
  facebook_page_name: string | null;
  instagram_user_id: string;
  instagram_username: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  last_error: string | null;
};

type InstagramMedia = {
  id: string;
  post_id: string;
  position: number;
  media_url: string;
  media_path: string | null;
  media_mime_type: string | null;
  media_kind: 'image' | 'video';
  ig_child_container_id: string | null;
};

type InstagramPost = {
  id: string;
  account_id: string;
  title: string | null;
  caption: string | null;
  post_type: 'feed_image' | 'feed_video' | 'reel' | 'story' | 'carousel';
  scheduled_at: string;
  campaign: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'container_created' | 'pending_confirmation' | 'published' | 'error' | 'cancelled';
  published_at: string | null;
  attempt_count: number | null;
  last_attempt_at: string | null;
  publishing_started_at: string | null;
  ig_media_id: string | null;
  permalink: string | null;
  error_message: string | null;
  recurrence_enabled: boolean;
  recurrence_frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrence_times: string[] | null;
  recurrence_weekdays: number[] | null;
  recurrence_month_days: number[] | null;
  recurrence_until: string | null;
  created_at: string;
  media?: InstagramMedia[];
};

type InstagramLog = { id: string; post_id: string | null; event_type: string; status: string | null; message: string | null; created_at: string; };

const POST_TYPES = [
  ['feed_image', 'Feed imagem'],
  ['feed_video', 'Feed vídeo'],
  ['reel', 'Reel'],
  ['story', 'Story'],
  ['carousel', 'Carrossel'],
] as const;

const toLocalInputValue = (date = new Date(Date.now() + 10 * 60 * 1000)) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

function fileToBase64(input: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(input);
  });
}

export default function InstagramScheduler({ session }: { session: any }) {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [logs, setLogs] = useState<InstagramLog[]>([]);
  const [title, setTitle] = useState('Post Código Base');
  const [caption, setCaption] = useState('');
  const [campaign, setCampaign] = useState('Sites');
  const [postType, setPostType] = useState<InstagramPost['post_type']>('feed_image');
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue());
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceTimes, setRecurrenceTimes] = useState('09:00, 13:30, 18:00');
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<number[]>([1,2,3,4,5]);
  const [recurrenceMonthDays, setRecurrenceMonthDays] = useState('1,15');
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadAccounts() {
    const { data } = await supabase.from('cb_instagram_accounts').select('*').order('created_at', { ascending: false });
    setAccounts(data || []);
    if (!selectedAccountId && data?.[0]?.id) setSelectedAccountId(data[0].id);
  }

  async function loadPosts() {
    const { data: postRows } = await supabase.from('cb_instagram_posts').select('*').order('scheduled_at', { ascending: false }).limit(80);
    const postIds = (postRows || []).map((post) => post.id);
    let mediaRows: InstagramMedia[] = [];
    if (postIds.length) {
      const { data } = await supabase.from('cb_instagram_post_media').select('*').in('post_id', postIds).order('position');
      mediaRows = data || [];
    }
    setPosts((postRows || []).map((post) => ({ ...post, media: mediaRows.filter((media) => media.post_id === post.id) })));
  }

  async function loadLogs() {
    const { data } = await supabase.from('cb_instagram_publish_logs').select('id,post_id,event_type,status,message,created_at').order('created_at', { ascending: false }).limit(20);
    setLogs(data || []);
  }

  async function loadAll() { await Promise.all([loadAccounts(), loadPosts(), loadLogs()]); }
  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (!posts.some((post) => ['publishing', 'container_created', 'pending_confirmation'].includes(post.status))) return;
    const timer = window.setInterval(loadAll, 10000);
    return () => window.clearInterval(timer);
  }, [posts]);

  const campaigns = Array.from(new Set(['Sites', 'IA', 'Automação', 'Dashboards', 'Suporte', ...posts.map((post) => post.campaign).filter(Boolean) as string[]]));
  const filteredPosts = posts.filter((post) => (statusFilter === 'all' || post.status === statusFilter) && (typeFilter === 'all' || post.post_type === typeFilter) && (campaignFilter === 'all' || post.campaign === campaignFilter));
  const calendarPosts = filteredPosts.slice().sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()).slice(0, 8);
  const selectedAccount = useMemo(() => accounts.find((account) => account.id === selectedAccountId), [accounts, selectedAccountId]);

  const badge = (status: string) => ({
    scheduled: 'bg-cyan-400/10 text-cyan-200 border-cyan-400/20',
    publishing: 'bg-orange-400/10 text-orange-200 border-orange-400/20',
    container_created: 'bg-purple-400/10 text-purple-200 border-purple-400/20',
    pending_confirmation: 'bg-yellow-400/10 text-yellow-200 border-yellow-400/20',
    published: 'bg-green-400/10 text-green-200 border-green-400/20',
    error: 'bg-red-400/10 text-red-200 border-red-400/20',
    cancelled: 'bg-gray-400/10 text-gray-200 border-gray-400/20',
  }[status] || 'bg-white/10 text-white border-white/10');

  function validateFiles() {
    if (!selectedAccountId) throw new Error('Conecte/selecione uma conta Instagram primeiro.');
    if (!files.length) throw new Error('Adicione mídia.');
    if (postType === 'carousel' && files.length < 2) throw new Error('Carrossel precisa de pelo menos 2 mídias. Se passar de 10, eu divido automaticamente em múltiplos carrosséis.');
    if (postType !== 'carousel' && files.length !== 1) throw new Error('Este tipo aceita apenas 1 mídia.');
    if (postType === 'feed_image' && !files[0].type.startsWith('image/')) throw new Error('Feed imagem precisa de imagem.');
    if (['feed_video', 'reel'].includes(postType) && !files[0].type.startsWith('video/')) throw new Error('Este tipo precisa de vídeo MP4.');
    if (files.some((file) => file.size > 100 * 1024 * 1024)) throw new Error('Mídia acima de 100 MB.');
  }

  async function uploadFiles() {
    const uploaded = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${selectedAccountId}/${Date.now()}-${index}-${safeName}`;
      const { error } = await supabase.storage.from('instagram-media').upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('instagram-media').getPublicUrl(path);
      uploaded.push({ position: index, media_url: data.publicUrl, media_path: path, media_mime_type: file.type, media_kind: file.type.startsWith('video/') ? 'video' : 'image' });
    }
    return uploaded;
  }

  async function connectInstagram() {
    setLoading(true); setNotice('');
    try {
      const res = await fetch(`${supabaseFunctionsUrl}/instagram-oauth-start`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao iniciar OAuth Meta');
      window.open(data.url, '_blank', 'noopener,noreferrer');
      setNotice('Autorize no Meta/Facebook. Depois volte aqui e clique em Atualizar.');
    } catch (err: any) {
      setNotice(`Erro ao conectar: ${err.message || err}`);
    } finally { setLoading(false); }
  }

  async function generateCaption() {
    const image = files.find((file) => file.type.startsWith('image/'));
    if (!image) return setNotice('Anexe uma imagem para a IA analisar.');
    if (image.size > 5 * 1024 * 1024) return setNotice('Imagem muito grande para IA. Use até 5 MB.');
    setGeneratingCaption(true); setNotice('Gerando legenda para Instagram...');
    try {
      const images = await Promise.all(files.filter((file) => file.type.startsWith('image/')).slice(0, 6).map(async (file) => ({ imageBase64: await fileToBase64(file), mimeType: file.type })));
      const res = await fetch(`${supabaseFunctionsUrl}/generate-instagram-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ imageBase64: images[0]?.imageBase64, mimeType: images[0]?.mimeType, images, postType, title, campaign }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.caption) throw new Error(data.error || 'Falha ao gerar legenda');
      setCaption(data.caption);
      setNotice('Legenda gerada. Revise antes de agendar.');
    } catch (err: any) {
      setNotice(`Erro IA: ${err.message || err}`);
    } finally { setGeneratingCaption(false); }
  }

  const parseTimes = () => recurrenceTimes.split(/[;,\n ]+/).map((item) => item.trim()).filter((item) => /^\d{2}:\d{2}$/.test(item));
  const parseMonthDays = () => recurrenceMonthDays.split(/[;,\n ]+/).map((item) => Number(item.trim())).filter((day) => day >= 1 && day <= 31);
  const toggleWeekday = (day: number) => setRecurrenceWeekdays((items) => items.includes(day) ? items.filter((item) => item !== day) : [...items, day].sort());
  function carouselChunks<T>(items: T[]) {
    if (postType !== 'carousel' || items.length <= 10) return [items];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += 10) chunks.push(items.slice(i, i + 10));
    if (chunks.length > 1 && chunks[chunks.length - 1].length === 1) chunks[chunks.length - 1].unshift(chunks[chunks.length - 2].pop() as T);
    return chunks;
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setNotice('');
    try {
      validateFiles();
      const uploaded = await uploadFiles();
      const chunks = carouselChunks(uploaded);
      for (let index = 0; index < chunks.length; index++) {
        const scheduledDate = new Date(new Date(scheduledAt).getTime() + index * 60 * 1000).toISOString();
        const { data: post, error } = await supabase.from('cb_instagram_posts').insert({ account_id: selectedAccountId, title: chunks.length > 1 ? `${title} (${index + 1}/${chunks.length})` : title, caption, post_type: postType, scheduled_at: scheduledDate, campaign, timezone: 'America/Sao_Paulo', recurrence_enabled: recurrenceFrequency !== 'none', recurrence_frequency: recurrenceFrequency, recurrence_times: recurrenceFrequency === 'none' ? [] : parseTimes(), recurrence_weekdays: recurrenceFrequency === 'weekly' ? recurrenceWeekdays : [], recurrence_month_days: recurrenceFrequency === 'monthly' ? parseMonthDays() : [], recurrence_until: recurrenceUntil ? new Date(recurrenceUntil).toISOString() : null, created_by: session?.user?.id }).select('id').single();
        if (error) throw error;
        const { error: mediaError } = await supabase.from('cb_instagram_post_media').insert(chunks[index].map((media, pos) => ({ ...media, position: pos, post_id: post.id })));
        if (mediaError) throw mediaError;
      }
      setNotice(chunks.length > 1 ? `${chunks.length} carrosséis agendados automaticamente (limite Instagram: 10 mídias por carrossel).` : 'Post Instagram agendado.');
      setCaption(''); setFiles([]); setScheduledAt(toLocalInputValue());
      await loadAll();
    } catch (err: any) {
      setNotice(`Erro: ${err.message || err}`);
    } finally { setLoading(false); }
  }

  async function publishNow(post: InstagramPost) {
    setLoading(true); setNotice('');
    try {
      const res = await fetch(`${supabaseFunctionsUrl}/publish-instagram-post`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ id: post.id }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao publicar');
      setNotice(data.status === 'pending_confirmation' ? 'Publicação incerta; confira o Instagram antes de reenviar.' : 'Publicado no Instagram.');
      await loadAll();
    } catch (err: any) {
      setNotice(`Erro ao publicar: ${err.message || err}`);
      await loadAll();
    } finally { setLoading(false); }
  }

  async function cancelPost(post: InstagramPost) {
    await supabase.from('cb_instagram_posts').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', post.id);
    await loadAll();
  }

  return (
    <section className="rounded-3xl border border-pink-400/20 bg-pink-400/[0.03] p-6 shadow-[0_0_50px_rgba(236,72,153,0.08)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Instagram className="text-pink-300" /> Instagram agendado</h2>
          <p className="mt-1 text-sm text-gray-400">Agende feed, story, reel e carrossel via Instagram Graph API oficial.</p>
        </div>
        <div className="flex gap-2"><button onClick={connectInstagram} disabled={loading} className="rounded-xl bg-pink-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50">Conectar Instagram</button><button onClick={loadAll} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={16} className="inline mr-2" />Atualizar</button></div>
      </div>

      <div className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-2"><span className="text-sm font-bold text-gray-200">Conta Instagram</span><select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400"><option value="">Selecione/conecte uma conta</option>{accounts.map((account) => <option key={account.id} value={account.id}>@{account.instagram_username || account.instagram_user_id} • {account.facebook_page_name || 'Página Meta'}</option>)}</select></label>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-300"><p className="font-bold text-white">Status da conta</p><p className="mt-1">{selectedAccount ? (selectedAccount.is_active ? 'Ativa' : 'Inativa') : 'Nenhuma conta'}</p>{selectedAccount?.token_expires_at && <p className="text-xs text-gray-500">Token expira: {new Date(selectedAccount.token_expires_at).toLocaleDateString('pt-BR')}</p>}{selectedAccount?.last_error && <p className="mt-1 text-xs text-red-300">{selectedAccount.last_error}</p>}</div>
      </div>

      <form onSubmit={createPost} className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-2">
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Título interno</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400" /></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Data e horário</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400" /></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Tipo</span><select value={postType} onChange={(e) => { setPostType(e.target.value as any); setFiles([]); }} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400">{POST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Campanha</span><select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400">{campaigns.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Recorrência automática</span><select value={recurrenceFrequency} onChange={(e) => setRecurrenceFrequency(e.target.value as any)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-pink-400"><option value="none">Uma vez</option><option value="daily">Todos os dias</option><option value="weekly">Semanal</option><option value="monthly">Mensal</option></select></label>
        {recurrenceFrequency !== 'none' && <div className="grid gap-3 rounded-2xl border border-pink-400/20 bg-pink-400/5 p-4 lg:col-span-2 md:grid-cols-2"><label className="space-y-1"><span className="text-xs font-bold text-pink-100">Horários do dia</span><input value={recurrenceTimes} onChange={(e) => setRecurrenceTimes(e.target.value)} placeholder="09:00, 13:30, 18:00" className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm outline-none focus:border-pink-400" /></label><label className="space-y-1"><span className="text-xs font-bold text-pink-100">Repetir até (opcional)</span><input type="datetime-local" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm outline-none focus:border-pink-400" /></label>{recurrenceFrequency === 'weekly' && <div className="md:col-span-2"><p className="mb-2 text-xs font-bold text-pink-100">Dias da semana</p><div className="flex flex-wrap gap-2">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((label, day) => <button type="button" key={label} onClick={() => toggleWeekday(day)} className={`rounded-lg border px-3 py-1 text-xs ${recurrenceWeekdays.includes(day) ? 'border-pink-300 bg-pink-300 text-black' : 'border-white/10 bg-white/5 text-gray-300'}`}>{label}</button>)}</div></div>}{recurrenceFrequency === 'monthly' && <label className="space-y-1 md:col-span-2"><span className="text-xs font-bold text-pink-100">Dias do mês</span><input value={recurrenceMonthDays} onChange={(e) => setRecurrenceMonthDays(e.target.value)} placeholder="1, 10, 20" className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm outline-none focus:border-pink-400" /></label>}</div>}
        <label className="space-y-2 lg:col-span-2"><span className="text-sm font-bold text-gray-200">Mídia {postType === 'carousel' ? '(2+ arquivos; acima de 10 vira múltiplos carrosséis)' : '(1 arquivo)'}</span><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#05070D] px-3 py-3"><ImagePlus size={18} className="text-pink-300" /><input type="file" multiple={postType === 'carousel'} accept="image/png,image/jpeg,image/webp,video/mp4" onChange={(e) => setFiles(Array.from(e.target.files || []))} className="min-w-0 text-sm" /></div></label>
        {!!files.length && <div className="grid gap-3 lg:col-span-2 md:grid-cols-4">{files.map((file, index) => <div key={`${file.name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-2"><div className="h-28 overflow-hidden rounded-lg bg-black/30 grid place-items-center">{file.type.startsWith('video/') ? <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" /> : <img src={URL.createObjectURL(file)} className="h-full w-full object-cover" />}</div><p className="mt-2 truncate text-xs text-gray-400">{index + 1}. {file.name}</p></div>)}</div>}
        <label className="space-y-2 lg:col-span-2"><span className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-gray-200"><span>Legenda</span><button type="button" onClick={generateCaption} disabled={generatingCaption || !files.some((file) => file.type.startsWith('image/'))} className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-3 py-2 text-xs font-bold text-purple-100 disabled:opacity-40"><Sparkles size={15} className="inline mr-1" />{generatingCaption ? 'Gerando...' : 'Gerar legenda com IA'}</button></span><textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="min-h-[130px] w-full rounded-xl border border-white/10 bg-[#05070D] p-3 outline-none focus:border-pink-400" placeholder="Legenda, hashtags e CTA..." /></label>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button disabled={loading || generatingCaption} className="rounded-xl bg-pink-400 px-5 py-3 font-bold text-black disabled:opacity-50"><UploadCloud size={18} className="inline mr-2" />Agendar Instagram</button>{notice && <p className="text-sm text-pink-100">{notice}</p>}</div>
      </form>

      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-white">Calendário rápido</h3><div className="flex flex-wrap gap-2"><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm"><option value="all">Todos status</option><option value="scheduled">Agendados</option><option value="published">Publicados</option><option value="error">Erro</option><option value="cancelled">Cancelados</option></select><select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm"><option value="all">Todos tipos</option>{POST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#05070D] px-3 py-2 text-sm"><option value="all">Todas campanhas</option>{campaigns.map((item) => <option key={item} value={item}>{item}</option>)}</select></div></div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">{calendarPosts.map((post) => <div key={post.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-gray-500">{new Date(post.scheduled_at).toLocaleString('pt-BR')}</p><p className="mt-1 line-clamp-1 text-sm font-bold text-white">{post.title || 'Post Instagram'}</p><p className="mt-1 text-xs text-pink-200">{post.post_type} • {post.status}</p></div>)}{!calendarPosts.length && <p className="text-sm text-gray-500">Nenhum post no filtro.</p>}</div>
      </div>

      <div className="mt-6 grid gap-3">
        {filteredPosts.map((post) => {
          const firstMedia = post.media?.[0];
          return <div key={post.id} className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[88px_1fr_auto]">
            <div className="h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-white/5 grid place-items-center">{firstMedia ? (firstMedia.media_kind === 'video' ? <video src={firstMedia.media_url} className="h-full w-full object-cover" /> : <img src={firstMedia.media_url} className="h-full w-full object-cover" />) : <ImagePlus className="text-gray-500" />}</div>
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">{post.title || 'Post Instagram'}</h3><span className={`rounded-full border px-2 py-0.5 text-xs ${badge(post.status)}`}>{post.status}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-gray-300">{post.post_type}</span>{post.campaign && <span className="rounded-full border border-pink-400/20 px-2 py-0.5 text-xs text-pink-200">{post.campaign}</span>}</div><p className="mt-1 text-sm text-gray-300 line-clamp-2">{post.caption || 'Sem legenda'}</p><p className="mt-2 text-xs text-gray-500">Agendado: {new Date(post.scheduled_at).toLocaleString('pt-BR')} {post.published_at ? `• Publicado: ${new Date(post.published_at).toLocaleString('pt-BR')}` : ''}</p><p className="mt-1 text-xs text-gray-600">Tentativas: {post.attempt_count || 0}{post.ig_media_id ? ` • IG ID: ${post.ig_media_id}` : ''}</p>{post.permalink && <a href={post.permalink} target="_blank" className="mt-1 block text-xs text-cyan-300 underline">abrir no Instagram</a>}{post.status === 'pending_confirmation' && <p className="mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-2 text-xs text-yellow-100">Publicação incerta. Confira no Instagram antes de reenviar para evitar duplicidade.</p>}{post.error_message && <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">{post.error_message}</p>}</div>
            <div className="flex items-center gap-2 md:flex-col md:items-end"><button disabled={loading || !['scheduled','error','container_created'].includes(post.status)} onClick={() => publishNow(post)} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-40"><Send size={15} className="inline mr-1" />Publicar</button><button disabled={['published','publishing','pending_confirmation'].includes(post.status)} onClick={() => cancelPost(post)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100 disabled:opacity-40"><Trash2 size={15} className="inline mr-1" />Cancelar</button></div>
          </div>;
        })}
        {!filteredPosts.length && <p className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-500">Nenhum post Instagram neste filtro.</p>}
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4"><h3 className="mb-3 flex items-center gap-2 font-bold text-white"><Loader2 size={16} className="text-pink-300" />Logs recentes</h3><div className="grid gap-2 md:grid-cols-2">{logs.map((log) => <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('pt-BR')}</p><p className="text-sm font-bold text-white">{log.event_type} <span className="text-xs text-gray-500">{log.status}</span></p><p className="mt-1 text-xs text-gray-400">{log.message || 'sem mensagem'}</p></div>)}{!logs.length && <p className="text-sm text-gray-500">Sem logs ainda.</p>}</div></div>
    </section>
  );
}
