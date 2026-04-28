import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Projetos | Código Base",
  description: "Conheça nossos cases de sucesso em software, hardware e automação",
};

export default function ProjetosPage() {
  // Dados mockados - serão substituídos por dados do Supabase
  const projetos = [
    {
      id: "1",
      titulo: "Sistema de Gestão Empresarial",
      resumo: "ERP completo para indústria de médio porte com controle de estoque, vendas e financeiro.",
      cliente: "Indústria XYZ",
      nicho: "Indústria",
      tags: ["React", "Node.js", "PostgreSQL"],
      cover_url: "",
    },
    {
      id: "2",
      titulo: "Automação WhatsApp Business",
      resumo: "Sistema de atendimento automatizado com IA para e-commerce com 10k+ mensagens/dia.",
      cliente: "E-commerce ABC",
      nicho: "E-commerce",
      tags: ["Evolution API", "OpenAI", "n8n"],
      cover_url: "",
    },
    {
      id: "3",
      titulo: "IoT Industrial",
      resumo: "Rede de sensores para monitoramento de temperatura e umidade em tempo real.",
      cliente: "Frigorífico DEF",
      nicho: "Indústria",
      tags: ["ESP32", "MQTT", "Dashboard"],
      cover_url: "",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-bg-base via-bg-elevated to-bg-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nossos Projetos
            </h1>
            <p className="text-xl text-muted-foreground">
              Cases reais de empresas que transformaram seus processos com nossas soluções.
            </p>
          </div>
        </div>
      </section>

      {/* Projetos Grid */}
      <section className="py-24 bg-bg-elevated">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {projetos.map((projeto) => (
              <Link
                key={projeto.id}
                href={`/projetos/${projeto.id}`}
                className="group"
              >
                <div className="relative h-full p-6 rounded-2xl bg-bg-base border border-border hover:border-brand-cyan-500/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                  <div className="relative z-10 h-full flex flex-col">
                    {/* Cover placeholder */}
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-brand-cyan-500/20 to-accent-orange-500/20 mb-6" />

                    {/* Nicho badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan-500/10 border border-brand-cyan-500/20 text-brand-cyan-500 text-xs font-medium w-fit mb-4">
                      {projeto.nicho}
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-brand-cyan-500 transition-colors">
                      {projeto.titulo}
                    </h3>

                    <p className="text-muted-foreground mb-4 flex-grow">
                      {projeto.resumo}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {projeto.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-md bg-bg-elevated text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Cliente */}
                    <div className="text-sm text-muted-foreground mb-4">
                      Cliente: <span className="text-foreground">{projeto.cliente}</span>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center text-brand-cyan-500 font-medium">
                      Ver detalhes
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state quando não houver projetos */}
          {projetos.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-6">
                Em breve publicaremos nossos cases de sucesso.
              </p>
              <Button asChild>
                <Link href="/contato">Seja nosso próximo case</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Filtros (para implementar futuramente) */}
      {/* <section className="py-12 bg-bg-base border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" size="sm">Todos</Button>
            <Button variant="outline" size="sm">Software</Button>
            <Button variant="outline" size="sm">Hardware</Button>
            <Button variant="outline" size="sm">Automação</Button>
          </div>
        </div>
      </section> */}

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-cyan-500 to-accent-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Quer um projeto como esses?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Vamos conversar sobre como podemos ajudar seu negócio a crescer.
          </p>

          <Button size="lg" className="bg-white text-brand-cyan-500 hover:bg-white/90">
            Solicitar Orçamento
          </Button>
        </div>
      </section>
    </div>
  );
}
