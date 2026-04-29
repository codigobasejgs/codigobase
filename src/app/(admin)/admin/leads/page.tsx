"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  tipo_servico: string;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = ["todos", "novo", "qualificado", "em_atendimento", "ganho", "perdido"];

const statusStyle: Record<string, string> = {
  novo: "bg-[#00C8E8]/10 text-[#00C8E8]",
  qualificado: "bg-purple-500/10 text-purple-400",
  em_atendimento: "bg-yellow-500/10 text-yellow-400",
  ganho: "bg-green-500/10 text-green-400",
  perdido: "bg-[#FF7A00]/10 text-[#FF7A00]",
};

const PAGE_SIZE = 20;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("leads")
        .select("id, nome, email, whatsapp, empresa, tipo_servico, status, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "todos") query = query.eq("status", statusFilter);

      const { data, count } = await query;
      setLeads(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    };
    fetchLeads();
  }, [statusFilter, page]);

  const filtered = search.trim()
    ? leads.filter(
        (l) =>
          l.nome.toLowerCase().includes(search.toLowerCase()) ||
          l.email.toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-[#7A8BA8]">{total} contato{total !== 1 ? "s" : ""} recebido{total !== 1 ? "s" : ""}.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8BA8]" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#243352] bg-[#111827] py-2.5 pl-9 pr-4 text-sm text-[#EDF2F7] placeholder:text-[#7A8BA8] focus:border-[#00C8E8] focus:outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(0); }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-[#FF7A00] text-white"
                  : "border border-[#243352] text-[#7A8BA8] hover:border-[#FF7A00] hover:text-[#FF7A00]"
              }`}
            >
              {s === "todos" ? "Todos" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#1E2D45] bg-[#111827] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#7A8BA8]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#7A8BA8]">Nenhum lead encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E2D45] text-left text-xs font-semibold text-[#7A8BA8]">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3 hidden md:table-cell">E-mail</th>
                <th className="px-4 py-3 hidden lg:table-cell">Serviço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D45]">
              {filtered.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-[#0A0E1A]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`} className="font-semibold text-[#EDF2F7] hover:text-[#00C8E8]">
                      {lead.nome}
                    </Link>
                    {lead.empresa && <p className="text-xs text-[#7A8BA8]">{lead.empresa}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#7A8BA8]">{lead.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-[#7A8BA8]">{lead.tipo_servico}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle[lead.status] ?? "bg-[#1A2236] text-[#7A8BA8]"}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-[#3D5068]">
                    {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {lead.whatsapp && (
                      <a
                        href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7A8BA8] hover:text-[#FF7A00]"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg border border-[#243352] px-4 py-2 text-sm text-[#7A8BA8] disabled:opacity-40 hover:border-[#00C8E8] hover:text-[#00C8E8]"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-[#7A8BA8]">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-[#243352] px-4 py-2 text-sm text-[#7A8BA8] disabled:opacity-40 hover:border-[#00C8E8] hover:text-[#00C8E8]"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
