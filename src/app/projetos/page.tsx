import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Projetos | Código Base",
  description:
    "Mini cases de software, automação, IA e infraestrutura desenvolvidos pela Código Base para operações reais.",
};

const projetos = [
  {
    id: "erp-vendas-estoque",
    cliente: "Distribuidora · Região de Campinas",
    titulo: "ERP de Vendas, Estoque e Financeiro",
    nicho: "Software · ERP",
    problema:
      "Gestão feita em planilhas compartilhadas, com vendedores disputando o mesmo estoque e sem visão confiável do financeiro.",
    solucao:
      "Sistema web com controle de estoque em tempo real, pedidos, comissões e relatório gerencial para decisão diária.",
    resultado: "+38%",
    resultadoDescricao: "produtividade operacional nos primeiros 3 meses",
    tags: ["Next.js", "Node.js", "PostgreSQL", "Dashboard"],
    accent: "cyan",
  },
  {
    id: "bot-whatsapp-ia",
    cliente: "E-commerce de moda · São Paulo",
    titulo: "Bot de Atendimento WhatsApp + IA",
    nicho: "Automação · IA",
    problema:
      "Equipe de 2 pessoas respondendo centenas de mensagens por dia, com clientes esperando horas por rastreio e dúvidas simples.",
    solucao:
      "Fluxo de atendimento com IA para rastreio, FAQ, qualificação de compra e handoff para humano nos casos complexos.",
    resultado: "-70%",
    resultadoDescricao: "no tempo médio de resposta",
    tags: ["WhatsApp API", "IA", "n8n", "Webhooks"],
    accent: "orange",
  },
  {
    id: "monitoramento-iot-termico",
    cliente: "Indústria frigorífica · Interior de SP",
    titulo: "Rede IoT de Monitoramento Térmico",
    nicho: "Hardware · IoT",
    problema:
      "Variações de temperatura eram descobertas tarde demais, gerando risco de perda de carga e problemas sanitários.",
    solucao:
      "Sensores ESP32 com alertas em tempo real e dashboard histórico para acompanhar temperatura e umidade por ambiente.",
    resultado: "R$ 0",
    resultadoDescricao: "em perda de carga desde a instalação piloto",
    tags: ["ESP32", "IoT", "Dashboard", "Alertas"],
    accent: "cyan",
  },
];

export default function ProjetosPage() {
  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,200,232,0.12),transparent_46%),radial-gradient(ellipse_at_bottom_left,rgba(255,122,0,0.12),transparent_46%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Projetos</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Problemas reais resolvidos com tecnologia sob medida.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
              Os cases abaixo usam nomes neutros para preservar clientes, mas seguem a estrutura que importa: contexto, solução e impacto percebido.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {projetos.map((projeto) => {
              const isOrange = projeto.accent === "orange";
              return (
                <article key={projeto.id} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#243352] bg-[#111827] transition hover:-translate-y-1 hover:border-[#00C8E8]/40">
                  <div className={`min-h-44 p-6 ${isOrange ? "bg-[radial-gradient(ellipse_at_top_right,rgba(255,122,0,0.2),transparent_55%),#111827]" : "bg-[radial-gradient(ellipse_at_top_right,rgba(0,200,232,0.2),transparent_55%),#111827]"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A8BA8]">{projeto.cliente}</p>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-[#EDF2F7]">{projeto.titulo}</h2>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className={`mb-5 w-fit rounded-full px-3 py-1 text-xs font-bold ${isOrange ? "bg-[#FF7A00]/10 text-[#FF7A00]" : "bg-[#00C8E8]/10 text-[#00C8E8]"}`}>{projeto.nicho}</span>
                    <div className="space-y-4 text-sm leading-6">
                      <p className="text-[#7A8BA8]"><strong className="text-[#EDF2F7]">Problema:</strong> {projeto.problema}</p>
                      <p className="text-[#7A8BA8]"><strong className="text-[#EDF2F7]">Solução:</strong> {projeto.solucao}</p>
                    </div>
                    <div className={`mt-6 rounded-2xl border p-4 ${isOrange ? "border-[#FF7A00]/20 bg-[#FF7A00]/10" : "border-[#00C8E8]/20 bg-[#00C8E8]/10"}`}>
                      <div className={`text-3xl font-black ${isOrange ? "text-[#FF7A00]" : "text-[#00C8E8]"}`}>{projeto.resultado}</div>
                      <p className="mt-1 text-xs leading-5 text-[#7A8BA8]">{projeto.resultadoDescricao}</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {projeto.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#1A2236] px-3 py-1 text-xs text-[#7A8BA8]">{tag}</span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E2D45] bg-[#111827]/55 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Quer transformar um gargalo da sua empresa no próximo case?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#7A8BA8]">
            Comece por uma conversa objetiva. Você conta o problema, a gente mostra o caminho técnico mais seguro.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#E06800]">
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
            <Link href="/contato" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#243352] px-7 py-4 text-sm font-semibold text-[#00C8E8] transition hover:border-[#00C8E8]">
              Enviar briefing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
