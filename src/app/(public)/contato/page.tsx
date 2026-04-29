"use client";

import { useState } from "react";
import { Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";

export default function ContatoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp"),
      empresa: formData.get("empresa"),
      tipo_servico: formData.get("tipo_servico"),
      mensagem: formData.get("mensagem"),
      fonte: "site-contato",
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setError("Não foi possível enviar agora. Se preferir, fale direto pelo WhatsApp.");
        return;
      }

      setSuccess(true);
      e.currentTarget.reset();
      setTimeout(() => setSuccess(false), 6000);
    } catch {
      setError("Não foi possível enviar agora. Se preferir, fale direto pelo WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0E1A] text-[#EDF2F7]">
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,232,0.12),transparent_46%),radial-gradient(ellipse_at_bottom_right,rgba(255,122,0,0.12),transparent_46%)]" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#00C8E8]">Contato</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Conte o problema. A gente ajuda a mapear a solução.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#7A8BA8]">
              Você não precisa chegar com escopo pronto. Explique o gargalo, o objetivo ou a ideia — a Código Base traduz isso em caminho técnico.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="space-y-6">
              <div className="rounded-3xl border border-[#243352] bg-[#111827] p-6">
                <h2 className="text-2xl font-black">Contato direto</h2>
                <p className="mt-3 text-sm leading-6 text-[#7A8BA8]">
                  Para urgência ou orçamento rápido, o WhatsApp costuma ser o melhor canal.
                </p>
                <div className="mt-6 space-y-4">
                  <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-[#0A0E1A] p-4 text-[#EDF2F7] transition hover:text-[#00C8E8]">
                    <MessageCircle className="h-5 w-5 text-[#FF7A00]" />
                    <span>{siteConfig.contact.whatsappDisplay}</span>
                  </a>
                  <a href={siteConfig.links.email} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-[#0A0E1A] p-4 text-[#EDF2F7] transition hover:text-[#00C8E8]">
                    <Mail className="h-5 w-5 text-[#00C8E8]" />
                    <span>{siteConfig.contact.email}</span>
                  </a>
                  <div className="flex items-center gap-3 rounded-2xl bg-[#0A0E1A] p-4 text-[#EDF2F7]">
                    <MapPin className="h-5 w-5 text-[#00C8E8]" />
                    <span>Atendimento remoto para empresas no Brasil</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#243352] bg-[#111827] p-6">
                <h3 className="font-bold">Como funciona depois do contato</h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-[#7A8BA8]">
                  <li>1. Entendemos o problema e o contexto da operação.</li>
                  <li>2. Indicamos se faz sentido software, automação, infraestrutura ou uma combinação.</li>
                  <li>3. Você recebe um próximo passo objetivo, sem proposta genérica.</li>
                </ul>
              </div>
            </aside>

            <div className="rounded-3xl border border-[#243352] bg-[#111827] p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input id="nome" name="nome" required placeholder="Seu nome" className="mt-2 border-[#243352] bg-[#0A0E1A]" />
                  </div>
                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input id="empresa" name="empresa" placeholder="Nome da empresa" className="mt-2 border-[#243352] bg-[#0A0E1A]" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input id="email" name="email" type="email" required placeholder="seu@email.com" className="mt-2 border-[#243352] bg-[#0A0E1A]" />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp *</Label>
                    <Input id="whatsapp" name="whatsapp" required placeholder="(11) 98626-2240" className="mt-2 border-[#243352] bg-[#0A0E1A]" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipo_servico">O que você precisa resolver? *</Label>
                  <Select name="tipo_servico" required>
                    <SelectTrigger className="mt-2 border-[#243352] bg-[#0A0E1A]">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="software">Sistema, site ou dashboard</SelectItem>
                      <SelectItem value="hardware">Infraestrutura, manutenção ou hardware</SelectItem>
                      <SelectItem value="automacao">Automação, IA ou integração</SelectItem>
                      <SelectItem value="consultoria">Diagnóstico técnico</SelectItem>
                      <SelectItem value="outro">Ainda não sei definir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea id="mensagem" name="mensagem" required placeholder="Conte o cenário atual, o problema e o que você gostaria de melhorar..." rows={6} className="mt-2 border-[#243352] bg-[#0A0E1A]" />
                </div>

                {success && <div className="rounded-xl border border-[#00C8E8]/25 bg-[#00C8E8]/10 p-4 text-sm font-semibold text-[#00C8E8]">Mensagem enviada. Vamos retornar em breve.</div>}
                {error && <div className="rounded-xl border border-[#FF7A00]/25 bg-[#FF7A00]/10 p-4 text-sm font-semibold text-[#FF7A00]">{error}</div>}

                <Button type="submit" disabled={loading} className="w-full rounded-full bg-[#FF7A00] py-6 text-white hover:bg-[#E06800]">
                  {loading ? "Enviando..." : "Enviar mensagem"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-center text-xs leading-5 text-[#7A8BA8]">
                  Ao enviar, você concorda com nossa <a href="/privacidade" className="text-[#00C8E8] underline">Política de Privacidade</a>.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
