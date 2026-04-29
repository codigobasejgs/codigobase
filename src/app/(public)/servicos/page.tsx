import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, Cpu, MessageCircle, Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Serviços | Código Base",
  description:
    "Sistemas web, automações, IA, infraestrutura e hardware para empresas que precisam resolver tecnologia de ponta a ponta.",
};

const services = [
  {
    id: "software",
    icon: Code2,
    eyebrow: "Código",
    title: "Sistemas, sites e produtos digitais",
    problem: "Quando planilhas, WhatsApp e controles soltos começam a travar a operação.",
    description:
      "Criamos sistemas web, landing pages, dashboards, SaaS, APIs e portais sob medida para organizar processos e transformar dados em decisão.",
    result: "Operação centralizada, menos retrabalho e mais visibilidade para vender e atender melhor.",
    color: "cyan",
    items: [
      "Sites institucionais e landing pages de alta conversão",
      "Sistemas web, CRMs, ERPs leves e portais internos",
      "Dashboards, BI operacional e relatórios automatizados",
      "APIs, integrações e arquitetura pronta para escalar",
    ],
    tags: ["Next.js", "Node.js", "PostgreSQL", "Supabase", "SaaS", "Dashboards"],
  },
  {
    id: "hardware",
    icon: Cpu,
    eyebrow: "Base",
    title: "Infraestrutura, hardware e suporte técnico",
    problem: "Quando máquinas lentas, rede instável ou ambiente mal configurado viram prejuízo diário.",
    description:
      "Diagnosticamos, otimizamos e estruturamos a base técnica: desktops, notebooks, upgrades, rede, servidores e ambientes que precisam funcionar sem improviso.",
    result: "Ambiente mais estável, menos paradas e uma base confiável para o software performar.",
    color: "orange",
    items: [
      "Diagnóstico técnico de desktops, notebooks e servidores",
      "Upgrades, manutenção, otimização e padronização de ambiente",
      "Infraestrutura de rede, backup e operação local",
      "Projetos com sensores, IoT e monitoramento técnico",
    ],
    tags: ["Diagnóstico", "Upgrade", "Rede", "Servidores", "IoT", "Suporte"],
  },
  {
    id: "automacao",
    icon: Zap,
    eyebrow: "Código + Base",
    title: "Automação, IA e integrações",
    problem: "Quando sua equipe perde horas copiando dados, respondendo mensagens ou gerando relatórios manuais.",
    description:
      "Conectamos ferramentas, automatizamos rotinas, criamos agentes de IA e preparamos fluxos comerciais com rastreabilidade e segurança.",
    result: "Processos mais rápidos, menos erro humano e equipe focada no que realmente gera receita.",
    color: "cyan",
    items: [
      "Automações com n8n, webhooks e filas de processamento",
      "Integrações com WhatsApp, CRMs, ERPs e gateways externos",
      "Agentes de IA para atendimento, triagem e operação interna",
      "Captura, qualificação e roteamento de leads comerciais",
    ],
    tags: ["n8n", "WhatsApp API", "OpenAI", "Webhooks", "APIs", "Agentes IA"],
  },
];

export default function ServicosPage() {
  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,232,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(255,122,0,0.12),transparent_45%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Serviços</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Tecnologia completa para empresas que precisam operar melhor.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
              A Código Base une software, automação e infraestrutura para resolver o problema inteiro — do sistema que organiza até a base técnica que mantém tudo rodando.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#E06800]">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
              <Link href="/projetos" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#243352] px-6 py-3 text-sm font-semibold text-[#00C8E8] transition hover:border-[#00C8E8]">
                Ver projetos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E2D45] bg-[#111827]/55 py-8">
        <div className="container mx-auto grid gap-4 px-4 md:grid-cols-3">
          {[
            ["Diagnóstico", "entender o gargalo antes de propor solução"],
            ["Execução", "entregas semanais com visibilidade real"],
            ["Suporte", "o projeto não termina no deploy"],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-[#243352] bg-[#0A0E1A]/60 p-5">
              <h2 className="font-bold text-[#EDF2F7]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#7A8BA8]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {services.map((service, index) => {
        const Icon = service.icon;
        const isOrange = service.color === "orange";
        return (
          <section key={service.id} id={service.id} className={`py-24 ${index % 2 ? "bg-[#0A0E1A]" : "bg-[#111827]/35"}`}>
            <div className="container mx-auto px-4">
              <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
                <div className={index % 2 ? "lg:order-2" : ""}>
                  <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${isOrange ? "border-[#FF7A00]/25 bg-[#FF7A00]/10 text-[#FF7A00]" : "border-[#00C8E8]/25 bg-[#00C8E8]/10 text-[#00C8E8]"}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <p className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] ${isOrange ? "text-[#FF7A00]" : "text-[#00C8E8]"}`}>{service.eyebrow}</p>
                  <h2 className="text-3xl font-black tracking-tight md:text-5xl">{service.title}</h2>
                  <p className="mt-5 rounded-xl border-l-2 border-[#FF7A00] bg-[#FF7A00]/10 p-4 text-sm font-semibold leading-6 text-[#FF7A00]">{service.problem}</p>
                  <p className="mt-5 text-base leading-8 text-[#7A8BA8]">{service.description}</p>
                  <p className="mt-5 rounded-xl border border-[#00C8E8]/20 bg-[#00C8E8]/10 p-4 text-sm font-semibold leading-6 text-[#00C8E8]">{service.result}</p>
                </div>

                <div className="rounded-3xl border border-[#243352] bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,10,30,0.45)]">
                  <div className="space-y-4">
                    {service.items.map((item) => (
                      <div key={item} className="flex gap-3 rounded-2xl bg-[#0A0E1A]/70 p-4">
                        <CheckCircle2 className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isOrange ? "text-[#FF7A00]" : "text-[#00C8E8]"}`} />
                        <span className="text-sm leading-6 text-[#EDF2F7]">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-[#1A2236] px-3 py-1 text-xs font-medium text-[#7A8BA8]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="relative overflow-hidden py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,122,0,0.14),transparent_60%)]" />
        <div className="container relative mx-auto px-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#FF7A00]">Próximo passo</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Conte o problema. A gente mapeia o caminho técnico mais direto.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#7A8BA8]">
            Sem proposta genérica. Sem empurrar tecnologia que você não precisa. Primeiro diagnóstico, depois execução.
          </p>
          <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#E06800]">
            <MessageCircle className="h-4 w-4" /> Solicitar diagnóstico
          </a>
        </div>
      </section>
    </div>
  );
}
