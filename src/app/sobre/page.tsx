import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Code2, Cpu, MessageCircle, ShieldCheck, Wrench } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sobre | Código Base",
  description:
    "Conheça a Código Base: tecnologia prática para empresas que precisam unir software, infraestrutura, automação e suporte técnico.",
};

const pillars = [
  {
    icon: Code2,
    title: "Código que organiza",
    text: "Sistemas, dashboards, integrações e automações construídos para resolver o processo real, não apenas entregar telas bonitas.",
    color: "cyan",
  },
  {
    icon: Cpu,
    title: "Base que sustenta",
    text: "Diagnóstico de ambiente, hardware, rede e infraestrutura para reduzir paradas e garantir que a operação tenha onde rodar bem.",
    color: "orange",
  },
  {
    icon: Wrench,
    title: "Execução próxima",
    text: "Atendimento direto, escopo claro e evolução por etapas para transformar gargalos em entregas utilizáveis no dia a dia.",
    color: "cyan",
  },
];

const process = [
  "Entendimento do problema, contexto da operação e impacto no negócio.",
  "Diagnóstico técnico para separar sintoma, causa e prioridade.",
  "Plano de execução com próximos passos objetivos, sem empurrar tecnologia desnecessária.",
  "Entrega, acompanhamento e melhoria contínua depois que a solução entra em uso.",
];

export default function SobrePage() {
  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,232,0.12),transparent_46%),radial-gradient(ellipse_at_bottom_right,rgba(255,122,0,0.12),transparent_48%)]" />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Sobre a Código Base</p>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Tecnologia para empresas que precisam sair do improviso.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
                A Código Base nasce para unir duas dores que normalmente são tratadas separadas: o software que organiza a operação e a base técnica que mantém tudo funcionando.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#E06800]">
                  <MessageCircle className="h-4 w-4" /> Falar com especialista
                </a>
                <Link href="/servicos" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#243352] px-6 py-3 text-sm font-semibold text-[#00C8E8] transition hover:border-[#00C8E8]">
                  Ver serviços <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-[#243352] bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,10,30,0.45)]">
              <div className="rounded-2xl border border-[#00C8E8]/20 bg-[#00C8E8]/10 p-5">
                <ShieldCheck className="h-8 w-8 text-[#00C8E8]" />
                <h2 className="mt-4 text-2xl font-black">Código + Base</h2>
                <p className="mt-3 text-sm leading-6 text-[#7A8BA8]">
                  O nome resume o posicionamento: construir soluções digitais sob medida e cuidar da fundação técnica para que elas gerem resultado de verdade.
                </p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#0A0E1A] p-4">
                  <p className="text-3xl font-black text-[#FF7A00]">1</p>
                  <p className="mt-1 text-xs leading-5 text-[#7A8BA8]">parceiro para software, automação e infraestrutura</p>
                </div>
                <div className="rounded-2xl bg-[#0A0E1A] p-4">
                  <p className="text-3xl font-black text-[#00C8E8]">100%</p>
                  <p className="mt-1 text-xs leading-5 text-[#7A8BA8]">foco em problema real, execução e suporte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#FF7A00]">O que nos guia</p>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">Menos promessa genérica. Mais diagnóstico e entrega prática.</h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              const isOrange = pillar.color === "orange";
              return (
                <article key={pillar.title} className="rounded-3xl border border-[#243352] bg-[#111827] p-6">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${isOrange ? "border-[#FF7A00]/25 bg-[#FF7A00]/10 text-[#FF7A00]" : "border-[#00C8E8]/25 bg-[#00C8E8]/10 text-[#00C8E8]"}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-black">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#7A8BA8]">{pillar.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#1E2D45] bg-[#111827]/55 py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Processo</p>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">Como a conversa vira solução.</h2>
              <p className="mt-5 text-base leading-8 text-[#7A8BA8]">
                O ponto de partida não precisa ser um escopo pronto. Basta explicar o gargalo, a meta ou a ideia. A partir disso, traduzimos o cenário em caminho técnico.
              </p>
            </div>
            <div className="space-y-4">
              {process.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-[#243352] bg-[#0A0E1A]/70 p-5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FF7A00] text-sm font-black text-white">{index + 1}</div>
                  <p className="text-sm leading-6 text-[#EDF2F7]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 text-center">
        <div className="container mx-auto px-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#00C8E8]" />
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
            Se a tecnologia está travando sua operação, vale uma conversa.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#7A8BA8]">
            Conte o cenário atual e receba um próximo passo objetivo para software, automação, infraestrutura ou suporte.
          </p>
          <Link href="/contato" className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#E06800]">
            Enviar briefing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
