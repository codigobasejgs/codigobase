"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, QrCode, RefreshCw, Settings, Bot, Clock } from "lucide-react";

type Instance = { nome: string; numero: string | null; status: string; qrcode_url: string | null; instance_name_evolution: string };

export default function WhatsAppPage() {
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState("");

  async function load() {
    const res = await fetch("/api/admin/whatsapp/instance");
    const data = await res.json();
    setInstance(data.instance ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  async function connect() {
    setConnecting(true);
    const res = await fetch("/api/admin/whatsapp/instance/connect", { method: "POST" });
    const data = await res.json();
    if (data.qrcode?.base64) setInstance((prev) => prev ? { ...prev, qrcode_url: data.qrcode.base64 } : prev);
    setConnecting(false);
    await load();
  }

  async function configureWebhook() {
    setWebhookStatus("Configurando...");
    const res = await fetch("/api/admin/whatsapp/instance/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setWebhookStatus(res.ok ? "Webhook configurado" : "Erro ao configurar webhook");
  }

  const isConnected = instance?.status === "conectado" || instance?.status === "open";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#EDF2F7]">WhatsApp</h1>
        <p className="mt-1 text-sm text-[#7A8BA8]">Conecte a Evolution API, converse com clientes e programe status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/whatsapp/chat" className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5 transition hover:border-[#00C8E8]/50">
          <MessageSquare className="mb-3 h-6 w-6 text-[#00C8E8]" />
          <h2 className="font-semibold text-[#EDF2F7]">Chat</h2>
          <p className="mt-1 text-sm text-[#7A8BA8]">Responder conversas e controlar a IA.</p>
        </Link>
        <Link href="/admin/whatsapp/status" className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5 transition hover:border-[#00C8E8]/50">
          <Clock className="mb-3 h-6 w-6 text-[#FF7A00]" />
          <h2 className="font-semibold text-[#EDF2F7]">Status</h2>
          <p className="mt-1 text-sm text-[#7A8BA8]">Postar agora ou agendar status.</p>
        </Link>
        <Link href="/admin/whatsapp/ai" className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-5 transition hover:border-[#00C8E8]/50">
          <Bot className="mb-3 h-6 w-6 text-emerald-400" />
          <h2 className="font-semibold text-[#EDF2F7]">IA</h2>
          <p className="mt-1 text-sm text-[#7A8BA8]">Treinamento e auto-resposta.</p>
        </Link>
      </div>

      <div className="rounded-xl border border-[#1E2D45] bg-[#0D1526] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#EDF2F7]">Instância Evolution</h2>
            <p className="mt-1 text-sm text-[#7A8BA8]">{instance?.instance_name_evolution ?? "codigobase"}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isConnected ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
            {loading ? "Carregando" : isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="flex aspect-square items-center justify-center rounded-xl border border-[#243352] bg-[#0A0E1A]">
            {instance?.qrcode_url && !isConnected ? (
              <img src={instance.qrcode_url} alt="QR Code WhatsApp" className="h-full w-full rounded-xl object-contain p-3" />
            ) : isConnected ? (
              <div className="text-center text-emerald-400">WhatsApp conectado</div>
            ) : (
              <QrCode className="h-20 w-20 text-[#243352]" />
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-[#7A8BA8]">
              Clique em conectar, escaneie o QR Code com o WhatsApp e depois configure o webhook para receber mensagens no chat.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={connect} disabled={connecting || isConnected} className="flex items-center gap-2 rounded-lg bg-[#FF7A00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#E06E00] disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${connecting ? "animate-spin" : ""}`} />
                {connecting ? "Conectando..." : "Conectar / Gerar QR"}
              </button>
              <button onClick={configureWebhook} className="flex items-center gap-2 rounded-lg border border-[#243352] px-4 py-2 text-sm text-[#EDF2F7] transition hover:bg-[#111827]">
                <Settings className="h-4 w-4" />
                Configurar Webhook
              </button>
            </div>
            {webhookStatus && <p className="text-sm text-[#00C8E8]">{webhookStatus}</p>}
            <div className="rounded-lg bg-[#0A0E1A] p-3 text-xs text-[#7A8BA8]">
              Número: {instance?.numero || "Ainda não conectado"}<br />
              Status bruto: {instance?.status || "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
