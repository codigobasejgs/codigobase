import { Metadata } from "next";
import { Code2, Cpu, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Serviços | Código Base",
  description: "Software sob medida, hardware IoT e automações inteligentes para seu negócio",
};

export default function ServicosPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-bg-base via-bg-elevated to-bg-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nossos Serviços
            </h1>
            <p className="text-xl text-muted-foreground">
              Soluções completas em software, hardware e automação para empresas que querem crescer sem limites.
            </p>
          </div>
        </div>
      </section>

      {/* Software */}
      <section id="software" className="py-24 bg-bg-elevated">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-brand-cyan-500/10 flex items-center justify-center mb-6">
                <Code2 className="w-8 h-8 text-brand-cyan-500" />
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Desenvolvimento de Software
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                Criamos sistemas web e mobile personalizados que resolvem problemas reais do seu negócio.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Sistemas web (dashboards, ERPs, CRMs)",
                  "Aplicativos mobile (iOS e Android)",
                  "Plataformas SaaS multi-tenant",
                  "APIs e integrações",
                  "E-commerce e marketplaces",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-cyan-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button className="bg-brand-cyan-500 hover:bg-brand-cyan-600">
                Solicitar Orçamento
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-cyan-500/20 to-transparent border border-brand-cyan-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Hardware */}
      <section id="hardware" className="py-24 bg-bg-base">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1 relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent-orange-500/20 to-transparent border border-accent-orange-500/20" />
            </div>

            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-2xl bg-accent-orange-500/10 flex items-center justify-center mb-6">
                <Cpu className="w-8 h-8 text-accent-orange-500" />
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Soluções em Hardware
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                Desenvolvemos dispositivos físicos que conectam o mundo digital ao real.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Dispositivos IoT (sensores, atuadores)",
                  "Sistemas embarcados (ESP32, Arduino, Raspberry Pi)",
                  "Automação industrial",
                  "Controle de acesso e segurança",
                  "Monitoramento remoto",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-accent-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button className="bg-accent-orange-500 hover:bg-accent-orange-600">
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Automação */}
      <section id="automacao" className="py-24 bg-bg-elevated">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-brand-cyan-500/10 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-brand-cyan-500" />
              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Automação e Integrações
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                Conectamos seus sistemas e automatizamos processos repetitivos para você focar no que importa.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  "Integração entre sistemas (APIs, webhooks)",
                  "Automação de WhatsApp e redes sociais",
                  "Workflows inteligentes (n8n, Zapier)",
                  "Chatbots e assistentes virtuais",
                  "Sincronização de dados em tempo real",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-cyan-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button className="bg-brand-cyan-500 hover:bg-brand-cyan-600">
                Solicitar Orçamento
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-cyan-500/20 to-transparent border border-brand-cyan-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-cyan-500 to-accent-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Não encontrou o que procura?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Cada projeto é único. Conte-nos seu desafio e vamos criar a solução ideal.
          </p>

          <Button size="lg" className="bg-white text-brand-cyan-500 hover:bg-white/90">
            Falar com Especialista
          </Button>
        </div>
      </section>
    </div>
  );
}
