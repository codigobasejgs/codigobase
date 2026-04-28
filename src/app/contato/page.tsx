"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContatoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp"),
      empresa: formData.get("empresa"),
      tipo_servico: formData.get("tipo_servico"),
      mensagem: formData.get("mensagem"),
      fonte: "site",
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-bg-base via-bg-elevated to-bg-base">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Vamos conversar?
            </h1>
            <p className="text-xl text-muted-foreground">
              Conte-nos seu desafio e vamos encontrar a melhor solução juntos.
            </p>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section className="py-24 bg-bg-elevated">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Informações */}
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Entre em contato
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                Responderemos em até 24 horas. Prefere falar agora? Use nosso WhatsApp.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-brand-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">WhatsApp</h3>
                    <p className="text-muted-foreground">+55 (XX) XXXXX-XXXX</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-brand-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-mail</h3>
                    <p className="text-muted-foreground">contato@codigobase.com.br</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Localização</h3>
                    <p className="text-muted-foreground">Brasil</p>
                  </div>
                </div>
              </div>

              {/* Horário de atendimento */}
              <div className="mt-8 p-6 rounded-xl bg-bg-base border border-border">
                <h3 className="font-semibold mb-3">Horário de atendimento</h3>
                <p className="text-muted-foreground text-sm">
                  Segunda a Sexta: 9h às 18h<br />
                  Sábado: 9h às 13h
                </p>
              </div>
            </div>

            {/* Formulário */}
            <div className="p-8 rounded-2xl bg-bg-base border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    required
                    placeholder="Seu nome"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    required
                    placeholder="(XX) XXXXX-XXXX"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    name="empresa"
                    placeholder="Nome da sua empresa"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo_servico">Tipo de serviço *</Label>
                  <Select name="tipo_servico" required>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="automacao">Automação</SelectItem>
                      <SelectItem value="consultoria">Consultoria</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    required
                    placeholder="Conte-nos sobre seu projeto ou desafio..."
                    rows={5}
                    className="mt-2"
                  />
                </div>

                {success && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                    ✓ Mensagem enviada! Entraremos em contato em breve.
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-cyan-500 hover:bg-brand-cyan-600"
                >
                  {loading ? "Enviando..." : "Enviar mensagem"}
                  <Send className="ml-2 w-4 h-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, você concorda com nossa{" "}
                  <a href="/privacidade" className="underline">
                    Política de Privacidade
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
