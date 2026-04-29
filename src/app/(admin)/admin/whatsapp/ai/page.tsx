"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, Save, Send } from "lucide-react";

type Settings = {
  provider: "anthropic" | "openai" | "gemini";
  api_key: string;
  model: string;
  system_prompt: string;
  auto_reply: boolean;
  auto_reply_delay_ms: number;
  max_tokens: number;
};

const DEFAULT_PROMPT = `Você é o assistente virtual da Código Base, uma empresa de tecnologia sob medida.
Responda clientes com tom profissional, claro e consultivo.
Objetivo: entender a necessidade do cliente, coletar dados importantes e conduzir para uma conversa comercial.
Se não souber algo, diga que vai encaminhar para um especialista humano.
Nunca prometa preços ou prazos sem validação da equipe.`;

export default function AISettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    provider: "gemini",
    api_key: "",
    model: "gemini-2.5-flash",
    system_prompt: DEFAULT_PROMPT,
    auto_reply: false,
    auto_reply_delay_ms: 3000,
    max_tokens: 500,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("Olá, preciso de um sistema para minha empresa. Vocês fazem?");
  const [testReply, setTestReply] = useState("");

  useEffect(() => {
    fetch("/api/admin/ai-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings, api_key: d.settings.api_key ?? "" }));
      });
  }, []);

  const defaultModels: Record<string, string> = {
    anthropic: "claude-opus-4-7",
    openai: "gpt-4o",
    gemini: "gemini-2.5-flash",
  };

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-set model when provider changes
      if (key === "provider") {
        const p = value as string;
        next.model = defaultModels[p] ?? "";
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/ai-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings, api_key: data.settings.api_key ?? prev.api_key }));
    else alert(data.error ?? "Erro ao salvar");
    setSaving(false);
  }

  async function test() {
    setTesting(true);
    setTestReply("");
    const res = await fetch("/api/admin/ai-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMsg }),
    });
    const data = await res.json();
    setTestReply(data.reply ?? data.error ?? "Sem resposta");
    setTesting(false);
  }

  const input = "w-full rounded-lg border border-[#243352] bg-[#0A0E1A] px-3 py-2 text-sm text-[#EDF2F7] focus:border-[#00C8E8] focus:outline-none";
  const label = "mb-1.5 block text-sm font-medium text-[#A0AEC0]";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#EDF2F7]">IA do WhatsApp</h1>
        <p className="mt-1 text-sm text-[#7A8BA8]">Configure a chave, treinamento e auto-resposta para clientes.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={label}>Provider</label>
              <select className={input} value={settings.provider} onChange={(e) => set("provider", e.target.value as Settings["provider"])}>
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI ChatGPT</option>
              </select>
            </div>
            <div>
              <label className={label}>Modelo</label>
              <input className={input} value={settings.model} onChange={(e) => set("model", e.target.value)} placeholder={defaultModels[settings.provider] ?? "modelo"} />
            </div>
          </div>

          <div>
            <label className={label}>API Key</label>
            <input type="password" className={input} value={settings.api_key} onChange={(e) => set("api_key", e.target.value)} placeholder="Cole a chave aqui" />
          </div>

          <div>
            <label className={label}>Treinamento / Prompt do sistema</label>
            <textarea className={`${input} min-h-[220px] resize-y`} value={settings.system_prompt} onChange={(e) => set("system_prompt", e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-3 rounded-lg border border-[#243352] bg-[#0A0E1A] p-3 text-sm text-[#EDF2F7]">
              <input type="checkbox" checked={settings.auto_reply} onChange={(e) => set("auto_reply", e.target.checked)} />
              Auto-resposta ativa
            </label>
            <div>
              <label className={label}>Delay (ms)</label>
              <input type="number" min={1000} max={10000} step={500} className={input} value={settings.auto_reply_delay_ms} onChange={(e) => set("auto_reply_delay_ms", Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Max tokens</label>
              <input type="number" min={100} max={2000} className={input} value={settings.max_tokens} onChange={(e) => set("max_tokens", Number(e.target.value))} />
            </div>
          </div>

          <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E06E00] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar configuração
          </button>
        </div>

        <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#00C8E8]" />
            <h2 className="font-semibold text-[#EDF2F7]">Teste rápido</h2>
          </div>
          <textarea className={`${input} resize-none`} rows={4} value={testMsg} onChange={(e) => setTestMsg(e.target.value)} />
          <button onClick={test} disabled={testing} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00C8E8]/15 px-4 py-2 text-sm font-semibold text-[#00C8E8] disabled:opacity-50">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Testar IA
          </button>
          {testReply && <div className="mt-4 rounded-lg bg-[#0A0E1A] p-3 text-sm leading-6 text-[#EDF2F7] whitespace-pre-wrap">{testReply}</div>}
        </div>
      </div>
    </div>
  );
}
