import Link from "next/link";
import { ArrowRight, Code2, Cpu, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-bg-base via-bg-elevated to-bg-base">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent" />

        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan-500/10 border border-brand-cyan-500/20 text-brand-cyan-500 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Software, Hardware e Automação
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Soluções que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan-500 to-accent-orange-500">
                destravam
              </span>
              {" "}seu negócio
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Desenvolvemos sistemas sob medida, integrações inteligentes e automações que eliminam gargalos e aceleram resultados.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-accent-orange-500 hover:bg-accent-orange-600 text-white group">
                Falar com Especialista
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button size="lg" variant="outline" asChild>
                <Link href="/projetos">Ver Projetos</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-bg-elevated">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O que fazemos
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Três pilares que transformam desafios em oportunidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Software */}
            <div className="group relative p-8 rounded-2xl bg-bg-base border border-border hover:border-brand-cyan-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6 text-brand-cyan-500" />
                </div>

                <h3 className="text-2xl font-bold mb-4">Software</h3>
                <p className="text-muted-foreground mb-6">
                  Sistemas web e mobile personalizados, dashboards analíticos e plataformas SaaS que escalam com seu negócio.
                </p>

                <Link href="/servicos#software" className="text-brand-cyan-500 font-medium inline-flex items-center group/link">
                  Saiba mais
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Hardware */}
            <div className="group relative p-8 rounded-2xl bg-bg-base border border-border hover:border-accent-orange-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-accent-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-accent-orange-500" />
                </div>

                <h3 className="text-2xl font-bold mb-4">Hardware</h3>
                <p className="text-muted-foreground mb-6">
                  IoT, sensores industriais, dispositivos embarcados e soluções físicas que conectam o digital ao real.
                </p>

                <Link href="/servicos#hardware" className="text-accent-orange-500 font-medium inline-flex items-center group/link">
                  Saiba mais
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Automação */}
            <div className="group relative p-8 rounded-2xl bg-bg-base border border-border hover:border-brand-cyan-500/50 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-brand-cyan-500" />
                </div>

                <h3 className="text-2xl font-bold mb-4">Automação</h3>
                <p className="text-muted-foreground mb-6">
                  Integrações entre sistemas, workflows inteligentes e processos automatizados que economizam tempo e dinheiro.
                </p>

                <Link href="/servicos#automacao" className="text-brand-cyan-500 font-medium inline-flex items-center group/link">
                  Saiba mais
                  <ArrowRight className="ml-2 w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-brand-cyan-500 to-accent-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:50px_50px]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Agende uma conversa sem compromisso e descubra como podemos ajudar.
          </p>

          <Button size="lg" className="bg-white text-brand-cyan-500 hover:bg-white/90">
            Falar no WhatsApp
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
