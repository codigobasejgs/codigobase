import React, { useEffect, useMemo, useState } from 'react';
import { ImagePlus, RefreshCw, Send, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { supabase, supabaseFunctionsUrl } from './lib/supabaseClient';

type Draft = { id: string; draft_type: 'story' | 'carousel'; platform_targets: string[]; theme_category: string; theme_option: string; title: string | null; caption: string | null; status: 'draft' | 'generated' | 'approved' | 'scheduled' | 'rejected' | 'error'; scheduled_at: string | null; created_at: string; assets?: Asset[]; };
type Asset = { id: string; draft_id: string; position: number; media_url: string; media_path: string | null; mime_type: string; prompt: string | null; };

const THEMES: Record<string, string[]> = {
  'IA / Chatbot': ['Vendas', 'Suporte', 'Agendamentos', 'Dúvidas frequentes', 'Quero explicar melhor'],
  'Sistemas / Apps': ['Site profissional', 'Sistema com login/painel', 'App/PWA', 'Loja virtual', 'Quero explicar melhor'],
  'Dashboards / Dados': ['Power BI', 'Planilhas automáticas', 'Indicadores financeiros', 'Relatórios gerenciais', 'Quero explicar melhor'],
  'Marketing / Instagram': ['Posts e artes', 'Stories', 'Reels/vídeos', 'Gestão de conteúdo', 'Quero explicar melhor'],
  'Hardware / Suporte': ['Computador lento', 'Formatação/limpeza', 'Rede/Wi-Fi/firewall', 'Upgrade SSD/RAM', 'Quero explicar melhor'],
};

const toLocalInputValue = (date = new Date(Date.now() + 10 * 60 * 1000)) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function AiCreativeStudio({ session }: { session: any }) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [themeCategory, setThemeCategory] = useState('IA / Chatbot');
  const [themeOption, setThemeOption] = useState('Vendas');
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'whatsapp']);
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [storyCount, setStoryCount] = useState(3);
  const [carouselSlideCount, setCarouselSlideCount] = useState(5);
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue());
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const themeOptions = useMemo(() => THEMES[themeCategory] || [], [themeCategory]);

  async function loadDrafts() {
    const { data: draftRows } = await supabase.from('cb_ai_creative_drafts').select('*').order('created_at', { ascending: false }).limit(60);
    const ids = (draftRows || []).map((draft) => draft.id);
    let assets: Asset[] = [];
    if (ids.length) {
      const { data } = await supabase.from('cb_ai_creative_assets').select('*').in('draft_id', ids).order('position');
      assets = data || [];
    }
    setDrafts((draftRows || []).map((draft) => ({ ...draft, assets: assets.filter((asset) => asset.draft_id === draft.id) })));
  }
  useEffect(() => { loadDrafts(); }, []);

  function togglePlatform(platform: string) { setPlatforms((items) => items.includes(platform) ? items.filter((item) => item !== platform) : [...items, platform]); }

  async function generatePackage() {
    setLoading(true); setNotice(`Gerando pacote com ${provider === 'gemini' ? 'Google Gemini/Imagen' : 'OpenAI Images'}... isso pode levar alguns minutos.`);
    try {
      const res = await fetch(`${supabaseFunctionsUrl}/generate-ai-creatives`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ provider, themeCategory, themeOption, platforms, storyCount, carouselSlideCount, scheduledAt: new Date(scheduledAt).toISOString() }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao gerar criativos');
      setNotice(`Pacote gerado: ${data.drafts?.length || 0} drafts aguardando aprovação.`);
      await loadDrafts();
    } catch (err: any) { setNotice(`Erro: ${err.message || err}`); }
    finally { setLoading(false); }
  }

  async function patchDraft(draft: Draft, patch: Partial<Draft>) {
    const { error } = await supabase.from('cb_ai_creative_drafts').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', draft.id);
    if (error) return setNotice(`Erro: ${error.message}`);
    await loadDrafts();
  }

  async function scheduleDraft(draft: Draft, publishNow = false) {
    setLoading(true); setNotice('Agendando criativo aprovado...');
    try {
      const res = await fetch(`${supabaseFunctionsUrl}/schedule-approved-creative`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ draftId: draft.id, targets: draft.platform_targets, scheduledAt: new Date(scheduledAt).toISOString(), publishNow }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao agendar');
      setNotice('Criativo aprovado e enviado para os schedulers.');
      await loadDrafts();
    } catch (err: any) { setNotice(`Erro: ${err.message || err}`); }
    finally { setLoading(false); }
  }

  return <section className="rounded-3xl border border-purple-400/20 bg-purple-400/[0.03] p-6 shadow-[0_0_50px_rgba(168,85,247,0.08)]">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="text-purple-300" /> Criativos IA</h2><p className="mt-1 text-sm text-gray-400">Gere 3 stories + 1 carrossel com 5 imagens via OpenAI ou Gemini, com marca/contatos Código Base, aprove e agende.</p></div><button onClick={loadDrafts} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={16} className="inline mr-2" />Atualizar</button></div>

    <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 lg:grid-cols-4">
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Categoria</span><select value={themeCategory} onChange={(e) => { setThemeCategory(e.target.value); setThemeOption(THEMES[e.target.value][0]); }} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400">{Object.keys(THEMES).map((theme) => <option key={theme}>{theme}</option>)}</select></label>
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Tema</span><select value={themeOption} onChange={(e) => setThemeOption(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400">{themeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Data/hora sugerida</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400" /></label>
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Gerador</span><select value={provider} onChange={(e) => setProvider(e.target.value as 'openai' | 'gemini')} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400"><option value="openai">OpenAI Images</option><option value="gemini">Google Gemini / Imagen</option></select></label>
      <div className="space-y-2"><span className="text-sm font-bold text-gray-200">Plataformas</span><div className="flex gap-2 pt-1"><button type="button" onClick={() => togglePlatform('instagram')} className={`rounded-xl border px-3 py-2 text-sm ${platforms.includes('instagram') ? 'border-pink-300 bg-pink-300 text-black' : 'border-white/10 bg-white/5 text-gray-300'}`}>Instagram</button><button type="button" onClick={() => togglePlatform('whatsapp')} className={`rounded-xl border px-3 py-2 text-sm ${platforms.includes('whatsapp') ? 'border-green-300 bg-green-300 text-black' : 'border-white/10 bg-white/5 text-gray-300'}`}>WhatsApp</button></div></div>
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Stories/dia</span><input type="number" min={1} max={10} value={storyCount} onChange={(e) => setStoryCount(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400" /></label>
      <label className="space-y-2"><span className="text-sm font-bold text-gray-200">Slides carrossel</span><input type="number" min={2} max={10} value={carouselSlideCount} onChange={(e) => setCarouselSlideCount(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-[#05070D] px-3 py-3 outline-none focus:border-purple-400" /></label>
      <div className="flex items-end lg:col-span-2"><button disabled={loading || !platforms.length} onClick={generatePackage} className="rounded-xl bg-purple-400 px-5 py-3 font-bold text-black disabled:opacity-50"><ImagePlus size={18} className="inline mr-2" />Gerar pacote diário</button></div>
      {notice && <p className="text-sm text-purple-100 lg:col-span-4">{notice}</p>}
    </div>

    <div className="mt-6 grid gap-4">
      {drafts.map((draft) => <div key={draft.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-white">{draft.title || draft.theme_option}</h3><p className="text-xs text-gray-500">{draft.draft_type} • {draft.theme_category} • {draft.status} • {draft.platform_targets?.join(', ')}</p></div><div className="flex flex-wrap gap-2"><button disabled={draft.status === 'rejected'} onClick={() => patchDraft(draft, { status: 'approved' as any })} className="rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-2 text-xs text-green-100"><ThumbsUp size={14} className="inline mr-1" />Aprovar</button><button disabled={draft.status === 'scheduled'} onClick={() => patchDraft(draft, { status: 'rejected' as any })} className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100"><ThumbsDown size={14} className="inline mr-1" />Rejeitar</button><button disabled={loading || !['approved','generated'].includes(draft.status)} onClick={() => scheduleDraft(draft)} className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-black"><Send size={14} className="inline mr-1" />Agendar</button><button disabled={loading || !['approved','generated'].includes(draft.status)} onClick={() => scheduleDraft(draft, true)} className="rounded-xl bg-orange-400 px-3 py-2 text-xs font-bold text-black">Publicar agora</button></div></div><div className="grid gap-3 md:grid-cols-5">{draft.assets?.map((asset) => <img key={asset.id} src={asset.media_url} className="h-52 w-full rounded-xl border border-white/10 object-cover" />)}</div><textarea value={draft.caption || ''} onChange={(e) => setDrafts((items) => items.map((item) => item.id === draft.id ? { ...item, caption: e.target.value } : item))} onBlur={(e) => patchDraft(draft, { caption: e.target.value })} className="mt-3 min-h-[130px] w-full rounded-xl border border-white/10 bg-[#05070D] p-3 text-sm outline-none focus:border-purple-400" /></div>)}
      {!drafts.length && <p className="rounded-2xl border border-white/10 bg-black/20 p-6 text-gray-500">Nenhum criativo gerado ainda.</p>}
    </div>
  </section>;
}
