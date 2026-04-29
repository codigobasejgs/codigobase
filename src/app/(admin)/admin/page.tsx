import Link from "next/link";
import { ArrowRight, FileText, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, string> = {
  novo: "bg-[#00C8E8]/10 text-[#00C8E8]",
  qualificado: "bg-purple-500/10 text-purple-400",
  em_atendimento: "bg-yellow-500/10 text-yellow-400",
  ganho: "bg-green-500/10 text-green-400",
  perdido: "bg-[#FF7A00]/10 text-[#FF7A00]",
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalLeads },
    { count: newLeads },
    { count: publishedPosts },
    { count: draftPosts },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).gte("created_at", yesterday),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "publicado"),
    supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "rascunho"),
    supabase.from("leads").select("id, nome, email, tipo_servico, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const cards = [
    { label: "Total de leads", value: totalLeads ?? 0, color: "text-[#00C8E8]", icon: Users },
    { label: "Últimas 24h", value: newLeads ?? 0, color: "text-[#FF7A00]", icon: Users },
    { label: "Posts publicados", value: publishedPosts ?? 0, color: "text-green-400", icon: FileText },
    { label: "Rascunhos", value: draftPosts ?? 0, color: "text-yellow-400", icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[#7A8BA8]">Visão geral do painel.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#1E2D45] bg-[#111827] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#7A8BA8]">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#1E2D45] bg-[#111827]">
        <div className="flex items-center justify-between border-b border-[#1E2D45] px-6 py-4">
          <h2 className="font-bold">Leads recentes</h2>
          <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-[#00C8E8] hover:underline">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-[#1E2D45]">
          {recentLeads && recentLeads.length > 0 ? (
            recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="flex items-center gap-4 px-6 py-4 transition hover:bg-[#0A0E1A]"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-[#EDF2F7]">{lead.nome}</p>
                  <p className="truncate text-xs text-[#7A8BA8]">{lead.email} · {lead.tipo_servico}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[lead.status] ?? "bg-[#1A2236] text-[#7A8BA8]"}`}>
                  {lead.status}
                </span>
                <p className="flex-shrink-0 text-xs text-[#3D5068]">
                  {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                </p>
              </Link>
            ))
          ) : (
            <p className="px-6 py-8 text-center text-sm text-[#7A8BA8]">Nenhum lead ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
