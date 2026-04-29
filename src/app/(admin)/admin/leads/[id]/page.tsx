"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  cargo: string;
  mensagem: string;
  tipo_servico: string;
  fonte: string;
  status: string;
  score: number;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  created_at: string;
};

type Event = {
  id: string;
  tipo: string;
  ator_tipo: string;
  payload_json: Record<string, unknown>;
  created_at: string;
};

const STATUS_OPTIONS = ["novo", "qualificado", "em_atendimento", "ganho", "perdido"];

const statusStyle: Record<string, string> = {
  novo: "bg-[#00C8E8]/10 text-[#00C8E8] border-[#00C8E8]/20",
  qualificado: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  em_atendimento: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ganho: "bg-green-500/10 text-green-400 border-green-500/20",
  perdido: "bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/20",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [{ data: l }, { data: ev }] = await Promise.all([
        supabase.from("leads").select("*").eq("id", id).single(),
        supabase.from("lead_events").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      ]);
      setLead(l ?? null);
      setEvents(ev ?? []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!lead) return;
    setSaving(true);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setLead({ ...lead, status: newStatus });
      const supabase = createClient();
      const { data: ev } = await supabase
        .from("lead_events")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      setEvents(ev ?? []);
    }
    setSaving(false);
  };

  if (loading) return <div className="py-16 text-center text-sm text-[#7A8BA8]">Carregando...</div>;
  if (!lead) return <div className="py-16 text-center text-sm text-[#7A8BA8]">Lead não encontrado.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-[#7A8BA8] hover:text-[#EDF2F7]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{lead.nome}</h1>
          {lead.empresa && <p className="text-sm text-[#7A8BA8]">{lead.empresa}{lead.cargo ? ` · ${lead.cargo}` : ""}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5 space-y-4">
            <h2 className="font-bold text-sm text-[#7A8BA8] uppercase tracking-wider">Mensagem</h2>
            <p className="text-sm leading-7 text-[#EDF2F7] whitespace-pre-wrap">{lead.mensagem}</p>
          </div>

          <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5">
            <h2 className="mb-4 font-bold text-sm text-[#7A8BA8] uppercase tracking-wider">Dados do contato</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["E-mail", lead.email],
                ["WhatsApp", lead.whatsapp],
                ["Tipo de serviço", lead.tipo_servico],
                ["Fonte", lead.fonte],
                ["UTM Source", lead.utm_source],
                ["UTM Medium", lead.utm_medium],
                ["UTM Campaign", lead.utm_campaign],
                ["Data", new Date(lead.created_at).toLocaleString("pt-BR")],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-[#7A8BA8]">{label}</dt>
                    <dd className="mt-0.5 font-medium text-[#EDF2F7]">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5">
            <h2 className="mb-4 font-bold text-sm text-[#7A8BA8] uppercase tracking-wider">Histórico de eventos</h2>
            {events.length === 0 ? (
              <p className="text-sm text-[#7A8BA8]">Sem eventos ainda.</p>
            ) : (
              <ol className="space-y-3">
                {events.map((ev) => (
                  <li key={ev.id} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#00C8E8]" />
                    <div>
                      <span className="font-semibold text-[#EDF2F7]">{ev.tipo.replace(/_/g, " ")}</span>
                      <span className="ml-2 text-xs text-[#7A8BA8]">via {ev.ator_tipo}</span>
                      <p className="text-xs text-[#3D5068]">{new Date(ev.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5">
            <h2 className="mb-3 font-bold text-sm text-[#7A8BA8] uppercase tracking-wider">Status</h2>
            <div className={`mb-4 rounded-xl border px-3 py-2 text-xs font-bold ${statusStyle[lead.status] ?? "bg-[#1A2236] text-[#7A8BA8] border-[#243352]"}`}>
              {lead.status}
            </div>
            <div className="space-y-2">
              {STATUS_OPTIONS.filter((s) => s !== lead.status).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={saving}
                  className="w-full rounded-xl border border-[#243352] px-3 py-2 text-xs font-semibold text-[#7A8BA8] transition hover:border-[#00C8E8] hover:text-[#00C8E8] disabled:opacity-50"
                >
                  {saving ? "Salvando..." : `→ ${s.replace("_", " ")}`}
                </button>
              ))}
            </div>
          </div>

          {lead.whatsapp && (
            <a
              href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#E06800]"
            >
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
