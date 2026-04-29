import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de Privacidade | Código Base",
  description:
    "Política de Privacidade da Código Base sobre coleta, uso e proteção de dados enviados pelo site.",
};

const sections = [
  {
    title: "1. Dados que coletamos",
    content:
      "Coletamos os dados informados voluntariamente nos formulários do site, como nome, e-mail, WhatsApp, empresa, tipo de serviço e mensagem. Também podemos registrar dados técnicos básicos, como IP, navegador, origem de acesso e parâmetros de campanha, para segurança e melhoria do atendimento.",
  },
  {
    title: "2. Como usamos os dados",
    content:
      "Usamos as informações para responder solicitações, qualificar demandas comerciais, preparar diagnósticos técnicos, enviar propostas quando solicitado e melhorar nossos canais de atendimento. Não vendemos dados pessoais a terceiros.",
  },
  {
    title: "3. Compartilhamento",
    content:
      "Os dados podem ser processados por ferramentas necessárias à operação do site, como hospedagem, banco de dados, envio de e-mails, analytics e automações internas. Esse uso ocorre apenas para viabilizar o atendimento e a operação da Código Base.",
  },
  {
    title: "4. Cookies e analytics",
    content:
      "O site pode usar cookies técnicos e ferramentas de medição para entender navegação, origem de visitantes e desempenho das páginas. Quando ferramentas adicionais forem ativadas, elas serão usadas com foco em melhoria da experiência e geração de relatórios agregados.",
  },
  {
    title: "5. Retenção e segurança",
    content:
      "Mantemos os dados pelo tempo necessário para atendimento, relacionamento comercial, obrigações legais e histórico operacional. Aplicamos medidas técnicas e organizacionais razoáveis para reduzir riscos de acesso indevido, perda ou uso não autorizado.",
  },
  {
    title: "6. Seus direitos",
    content:
      "Você pode solicitar acesso, correção, atualização ou exclusão dos seus dados pessoais, conforme previsto na LGPD. Para isso, entre em contato pelo e-mail oficial informado nesta página.",
  },
];

export default function PrivacidadePage() {
  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,232,0.12),transparent_46%),radial-gradient(ellipse_at_bottom_right,rgba(255,122,0,0.12),transparent_46%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Privacidade</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">Política de Privacidade</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
              Esta política explica como a Código Base coleta, usa e protege os dados enviados por visitantes, leads e potenciais clientes pelo site.
            </p>
            <p className="mt-4 text-sm text-[#3D5068]">Última atualização: 28 de abril de 2026.</p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="h-fit rounded-3xl border border-[#243352] bg-[#111827] p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-black">Contato sobre dados</h2>
              <p className="mt-3 text-sm leading-6 text-[#7A8BA8]">
                Para exercer direitos relacionados à LGPD ou tirar dúvidas sobre privacidade, fale pelos canais oficiais.
              </p>
              <div className="mt-6 space-y-3">
                <a href={siteConfig.links.email} className="flex items-center gap-3 rounded-2xl bg-[#0A0E1A] p-4 text-sm text-[#EDF2F7] transition hover:text-[#00C8E8]">
                  <Mail className="h-4 w-4 text-[#00C8E8]" /> {siteConfig.contact.email}
                </a>
                <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-[#0A0E1A] p-4 text-sm text-[#EDF2F7] transition hover:text-[#FF7A00]">
                  <MessageCircle className="h-4 w-4 text-[#FF7A00]" /> {siteConfig.contact.whatsappDisplay}
                </a>
              </div>
            </aside>

            <div className="space-y-5">
              {sections.map((section) => (
                <article key={section.title} className="rounded-3xl border border-[#243352] bg-[#111827] p-6 md:p-8">
                  <h2 className="text-2xl font-black">{section.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-[#7A8BA8]">{section.content}</p>
                </article>
              ))}

              <article className="rounded-3xl border border-[#00C8E8]/20 bg-[#00C8E8]/10 p-6 md:p-8">
                <h2 className="text-2xl font-black text-[#00C8E8]">7. Alterações nesta política</h2>
                <p className="mt-4 text-sm leading-7 text-[#7A8BA8]">
                  Esta política pode ser atualizada para refletir mudanças no site, ferramentas utilizadas ou exigências legais. A versão vigente estará sempre disponível nesta página.
                </p>
              </article>

              <div className="text-center">
                <Link href="/contato" className="inline-flex items-center justify-center rounded-full bg-[#FF7A00] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#E06800]">
                  Falar com a Código Base
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
