"use client";

import { useEffect, useState } from "react";
import { Send, Bot, PauseCircle, PlayCircle } from "lucide-react";

type Conversation = { id: string; remote_jid: string; contact_name: string | null; last_message: string | null; last_message_at: string | null; unread_count: number; ai_paused: boolean };
type Message = { id: string; direcao: "in" | "out"; conteudo: string; created_at: string; status: string };

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    const res = await fetch("/api/admin/whatsapp/conversations");
    const data = await res.json();
    setConversations(data.conversations ?? []);
  }

  async function loadMessages(conv: Conversation) {
    setSelected(conv);
    const res = await fetch(`/api/admin/whatsapp/conversations/${encodeURIComponent(conv.remote_jid)}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
    await loadConversations();
  }

  async function sendMessage() {
    if (!selected || !text.trim()) return;
    setSending(true);
    const msg = text.trim();
    setText("");
    const res = await fetch(`/api/admin/whatsapp/conversations/${encodeURIComponent(selected.remote_jid)}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msg }),
    });
    if (res.ok) {
      // Admin respondeu → IA pausada automaticamente
      setSelected((prev) => prev ? { ...prev, ai_paused: true } : prev);
      await loadMessages(selected);
    }
    setSending(false);
  }

  async function toggleAI(conv: Conversation) {
    await fetch(`/api/admin/whatsapp/conversations/${encodeURIComponent(conv.remote_jid)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai_paused: !conv.ai_paused }),
    });
    await loadConversations();
    if (selected?.id === conv.id) setSelected({ ...conv, ai_paused: !conv.ai_paused });
  }

  // Polling: busca mensagens novas da Evolution API
  async function pollMessages() {
    try {
      await fetch("/api/cron/poll-messages");
    } catch { /* silent */ }
  }

  useEffect(() => {
    pollMessages().then(() => loadConversations());
    const timer = setInterval(() => {
      pollMessages().then(() => {
        loadConversations();
        if (selected) loadMessages(selected);
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [selected?.remote_jid]);

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-[#1E2D45] bg-[#0D1526]">
      <aside className="w-80 border-r border-[#1E2D45]">
        <div className="border-b border-[#1E2D45] p-4">
          <h1 className="text-lg font-semibold text-[#EDF2F7]">Conversas</h1>
          <p className="text-xs text-[#7A8BA8]">WhatsApp conectado à Evolution</p>
        </div>
        <div className="overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-[#7A8BA8]">Nenhuma conversa ainda.</p>
          ) : conversations.map((conv) => (
            <button key={conv.id} onClick={() => loadMessages(conv)} className={`flex w-full gap-3 border-b border-[#1E2D45] p-3 text-left transition hover:bg-[#111827] ${selected?.id === conv.id ? "bg-[#111827]" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C8E8]/15 text-sm font-bold text-[#00C8E8]">
                {(conv.contact_name || conv.remote_jid).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-[#EDF2F7]">{conv.contact_name || conv.remote_jid}</p>
                  {conv.unread_count > 0 && <span className="rounded-full bg-[#FF7A00] px-1.5 text-[10px] text-white">{conv.unread_count}</span>}
                </div>
                <p className="mt-1 truncate text-xs text-[#7A8BA8]">{conv.last_message || "Sem mensagens"}</p>
                {conv.ai_paused && <span className="mt-1 inline-flex text-[10px] text-yellow-400">IA pausada</span>}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        {selected ? (
          <>
            <header className="flex items-center justify-between border-b border-[#1E2D45] p-4">
              <div>
                <h2 className="font-semibold text-[#EDF2F7]">{selected.contact_name || selected.remote_jid}</h2>
                <p className="text-xs text-[#7A8BA8]">{selected.remote_jid}</p>
              </div>
              <button onClick={() => toggleAI(selected)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:bg-[#111827] ${selected.ai_paused ? "border-emerald-500/30 text-emerald-400" : "border-[#243352] text-[#EDF2F7]"}`}>
                {selected.ai_paused ? <PlayCircle className="h-4 w-4 text-emerald-400" /> : <PauseCircle className="h-4 w-4 text-yellow-400" />}
                {selected.ai_paused ? "Retomar IA" : "Pausar IA"}
              </button>
            </header>
            {selected.ai_paused && (
              <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                <PauseCircle className="h-3.5 w-3.5 flex-shrink-0" />
                IA pausada nesta conversa. Você está respondendo manualmente. Clique &quot;Retomar IA&quot; para reativar.
              </div>
            )}
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direcao === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${msg.direcao === "out" ? "bg-[#00C8E8] text-[#06111E]" : "bg-[#111827] text-[#EDF2F7]"}`}>
                    <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                    <p className={`mt-1 text-[10px] ${msg.direcao === "out" ? "text-[#06111E]/60" : "text-[#7A8BA8]"}`}>{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
            <footer className="border-t border-[#1E2D45] p-4">
              <div className="flex gap-2">
                <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Digite sua mensagem..." className="min-h-[44px] flex-1 resize-none rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] focus:border-[#00C8E8] focus:outline-none" />
                <button onClick={sendMessage} disabled={sending || !text.trim()} className="rounded-lg bg-[#FF7A00] px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-[#7A8BA8]"><Bot className="mb-3 h-10 w-10" />Selecione uma conversa</div>
        )}
      </main>
    </div>
  );
}
