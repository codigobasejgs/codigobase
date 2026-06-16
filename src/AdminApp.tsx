import React, { useEffect, useMemo, useState } from 'react';
import { Bot, LogOut, MessageCircle, PauseCircle, PlayCircle, RefreshCw, Send, Users, BarChart3, Flame, ShieldAlert } from 'lucide-react';
import { supabase, supabaseFunctionsUrl } from './lib/supabaseClient';

type Conversation = {
  id: string;
  remote_jid: string;
  status: string;
  ai_enabled: boolean;
  ai_paused: boolean;
  pause_reason: string | null;
  suspected_bot: boolean;
  service_interest: string | null;
  last_message_at: string | null;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'ai' | 'human' | 'system';
  from_me: boolean;
  message_type: string;
  content: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  created_at: string;
};

type Analytics = {
  total_contacts: number;
  total_conversations: number;
  total_inbound_messages: number;
  total_ai_messages: number;
  ai_paused_conversations: number;
  top_service_interest: string | null;
};

const StatCard = ({ icon: Icon, label, value, tone = 'cyan' }: any) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-gray-500 font-mono">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value ?? 0}</p>
      </div>
      <div className={`rounded-2xl p-3 ${tone === 'orange' ? 'bg-orange-500/15 text-orange-300' : tone === 'red' ? 'bg-red-500/15 text-red-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#05070D] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#08111F]/80 p-8 shadow-[0_0_60px_rgba(0,217,255,0.12)] backdrop-blur-xl">
        <img src="/logo.png" className="mx-auto mb-6 h-24 w-24 rounded-full object-cover" />
        <h1 className="text-center text-3xl font-bold">Admin Código Base</h1>
        <p className="mt-2 text-center text-sm text-gray-400">Entre com usuário Supabase Auth.</p>
        <div className="mt-8 space-y-4">
          <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-black transition hover:bg-cyan-300 disabled:opacity-60">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadAll() {
    if (!session?.access_token) return;
    const [analyticsRes, conversationsRes] = await Promise.all([
      fetch(`${supabaseFunctionsUrl}/admin-analytics`, { headers: { Authorization: `Bearer ${session.access_token}` } }).then((r) => r.json()),
      supabase.from('cb_whatsapp_conversations').select('*').order('updated_at', { ascending: false }).limit(100),
    ]);
    setAnalytics(analyticsRes.analytics || null);
    setServiceCounts(analyticsRes.serviceCounts || {});
    setConversations(conversationsRes.data || []);
    if (!selected && conversationsRes.data?.[0]) setSelected(conversationsRes.data[0]);
  }

  async function loadMessages(conversationId: string) {
    const { data } = await supabase
      .from('cb_whatsapp_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  useEffect(() => { if (session) loadAll(); }, [session]);
  useEffect(() => { if (selected) loadMessages(selected.id); }, [selected?.id]);

  const topServices = useMemo(() => Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 6), [serviceCounts]);

  async function toggleAi(conv: Conversation, paused: boolean) {
    await supabase.from('cb_whatsapp_conversations').update({
      ai_paused: paused,
      pause_reason: paused ? 'human_intervention' : null,
      updated_at: new Date().toISOString(),
    }).eq('id', conv.id);
    await loadAll();
    setSelected({ ...conv, ai_paused: paused, pause_reason: paused ? 'human_intervention' : null });
  }

  async function sendManual() {
    if (!selected || !reply.trim() || !session?.access_token) return;
    setSending(true);
    const text = reply.trim();
    setReply('');
    await fetch(`${supabaseFunctionsUrl}/send-whatsapp-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ conversationId: selected.id, remoteJid: selected.remote_jid, text, pauseAi: true }),
    });
    await loadMessages(selected.id);
    await loadAll();
    setSending(false);
  }

  if (loading) return <div className="min-h-screen bg-[#05070D] text-white grid place-items-center">Carregando admin...</div>;
  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-[#05070D] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05070D]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="text-xl font-bold">Admin Código Base</h1>
              <p className="text-xs text-gray-400">WhatsApp • Gemini IA • Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"><RefreshCw size={16} className="inline mr-2" />Atualizar</button>
            <button onClick={() => supabase.auth.signOut()} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20"><LogOut size={16} className="inline mr-2" />Sair</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} label="Pessoas" value={analytics?.total_contacts} />
          <StatCard icon={MessageCircle} label="Conversas" value={analytics?.total_conversations} />
          <StatCard icon={BarChart3} label="Msgs recebidas" value={analytics?.total_inbound_messages} tone="orange" />
          <StatCard icon={Bot} label="Msgs IA" value={analytics?.total_ai_messages} />
          <StatCard icon={PauseCircle} label="IA pausada" value={analytics?.ai_paused_conversations} tone="red" />
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Conversas</h2>
              <span className="text-xs text-gray-500">{conversations.length}</span>
            </div>
            <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
              {conversations.map((conv) => (
                <button key={conv.id} onClick={() => setSelected(conv)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === conv.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-sm text-white">{conv.remote_jid.replace('@s.whatsapp.net', '')}</p>
                    {conv.ai_paused ? <PauseCircle className="text-orange-300" size={18} /> : <Bot className="text-cyan-300" size={18} />}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{conv.service_interest || 'Serviço ainda não identificado'}</p>
                  {conv.suspected_bot && <p className="mt-2 text-xs text-red-300"><ShieldAlert size={13} className="inline mr-1" />Possível IA/bot</p>}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            {selected ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="font-mono text-lg font-bold">{selected.remote_jid}</h2>
                    <p className="text-sm text-gray-400">Interesse: {selected.service_interest || 'não classificado'} • Status IA: {selected.ai_paused ? 'pausada' : 'ativa'}</p>
                  </div>
                  <button onClick={() => toggleAi(selected, !selected.ai_paused)} className={`rounded-xl px-4 py-2 text-sm font-bold ${selected.ai_paused ? 'bg-cyan-400 text-black' : 'bg-orange-400 text-black'}`}>
                    {selected.ai_paused ? <PlayCircle size={16} className="inline mr-2" /> : <PauseCircle size={16} className="inline mr-2" />}
                    {selected.ai_paused ? 'Reativar IA' : 'Assumir humano'}
                  </button>
                </div>

                <div className="h-[470px] space-y-3 overflow-auto rounded-2xl bg-black/25 p-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${msg.from_me ? msg.sender_type === 'ai' ? 'bg-cyan-500/20 border border-cyan-400/20' : 'bg-orange-500/20 border border-orange-400/20' : 'bg-white/10 border border-white/10'}`}>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">{msg.sender_type} • {msg.message_type}</p>
                        <p className="whitespace-pre-wrap text-sm text-gray-100">{msg.content || '[mídia recebida]'}</p>
                        {msg.media_url && <a className="mt-2 block text-xs text-cyan-300 underline" href={msg.media_url} target="_blank">abrir mídia</a>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendManual()} className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-cyan-400" placeholder="Responder como humano (pausa IA automaticamente)..." />
                  <button disabled={sending || !reply.trim()} onClick={sendManual} className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-black disabled:opacity-50"><Send size={18} /></button>
                </div>
              </>
            ) : <div className="grid h-[620px] place-items-center text-gray-500">Nenhuma conversa ainda.</div>}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Flame className="text-orange-300" /> Serviços mais procurados</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {topServices.length ? topServices.map(([service, count]) => (
              <div key={service} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-gray-300">{service}</p>
                <p className="mt-1 text-2xl font-bold text-cyan-300">{count}</p>
              </div>
            )) : <p className="text-gray-500">Sem dados ainda. Assim que clientes chamarem, aparece aqui.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
