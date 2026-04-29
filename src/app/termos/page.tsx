import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Termos de Uso | Código Base",
  description:
    "Termos de Uso do site da Código Base para navegação, conteúdo institucional e solicitação de contato.",
};

const terms = [
  {
    title: "1. Aceitação dos termos",
    content:
      "Ao acessar este site, você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar com alguma condição, recomendamos interromper a navegação.",
  },
  {
    title: "2. Finalidade do site",
    content:
      "O site apresenta informações institucionais sobre serviços de software, automação, IA, infraestrutura, hardware e suporte técnico. O conteúdo tem caráter informativo e comercial, não representando proposta vinculante sem análise e formalização específica.",
  },
  {
    title: "3. Solicitações de contato",
    content:
      "Ao preencher formulários ou iniciar contato por WhatsApp/e-mail, você declara que as informações fornecidas são verdadeiras e autoriza a Código Base a responder sua solicitação pelos canais informados.",
  },
  {
    title: "4. Propostas e contratação",
    content:
      "Qualquer contratação de serviço depende de diagnóstico, definição de escopo, prazos, valores e condições comerciais próprias. Nenhuma informação publicada no site substitui contrato, proposta formal ou ordem de serviço.",
  },
  {
    title: "5. Propriedade intelectual",
    content:
      "Textos, identidade visual, estrutura das páginas e materiais publicados pertencem à Código Base ou são utilizados com autorização. É proibida a reprodução comercial sem autorização prévia.",
  },
  {
    title: "6. Uso adequado",
    content:
      "Você se compromete a não usar o site para envio de conteúdo ilegal, ofensivo, falso, spam, tentativa de invasão, engenharia reversa, exploração de vulnerabilidades ou qualquer prática que prejudique a disponibilidade e segurança da plataforma.",
  },
  {
    title: "7. Limitação de responsabilidade",
    content:
      "A Código Base busca manter o site disponível, seguro e atualizado, mas não garante ausência permanente de falhas, indisponibilidades, erros de conteúdo ou interrupções causadas por terceiros, infraestrutura externa ou manutenção.",
  },
  {
    title: "8. Alterações",
    content:
      "Estes termos podem ser atualizados a qualquer momento para refletir mudanças no site, serviços, legislação ou operação. A versão vigente estará sempre disponível nesta página.",
  },
];

export default function TermosPage() {
  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,200,232,0.12),transparent_46%),radial-gradient(ellipse_at_bottom_left,rgba(255,122,0,0.12),transparent_46%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#FF7A00]">Termos</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">Termos de Uso</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
              Regras básicas para navegação no site da Código Base, uso das informações publicadas e envio de solicitações comerciais.
            </p>
            <p className="mt-4 text-sm text-[#3D5068]">Última atualização: 28 de abril de 2026.</p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 rounded-3xl border border-[#243352] bg-[#111827] p-6 md:p-8">
              <FileText className="h-9 w-9 text-[#00C8E8]" />
              <h2 className="mt-4 text-2xl font-black">Resumo rápido</h2>
              <p className="mt-3 text-sm leading-7 text-[#7A8BA8]">
                O site serve para apresentar a Código Base e receber contatos. Projetos, prazos, valores e responsabilidades só passam a valer após alinhamento e formalização comercial.
              </p>
            </div>

            <div className="space-y-5">
              {terms.map((term) => (
                <article key={term.title} className="rounded-3xl border border-[#243352] bg-[#111827] p-6 md:p-8">
                  <h2 className="text-2xl font-black">{term.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-[#7A8BA8]">{term.content}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-6 text-center md:p-8">
              <h2 className="text-2xl font-black text-[#FF7A00]">Dúvidas sobre estes termos?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#7A8BA8]">
                Fale com a Código Base pelos canais oficiais antes de enviar informações ou contratar qualquer serviço.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF7A00] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#E06800]">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <Link href="/privacidade" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#243352] px-6 py-3 text-sm font-semibold text-[#00C8E8] transition hover:border-[#00C8E8]">
                  Política de Privacidade <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
