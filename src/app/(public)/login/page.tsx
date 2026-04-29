"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-oficial.png"
            alt="Código Base"
            width={52}
            height={52}
            className="mb-4 rounded-full drop-shadow-[0_0_8px_rgba(0,200,232,0.3)]"
          />
          <h1 className="text-2xl font-black tracking-tight text-[#EDF2F7]">Área restrita</h1>
          <p className="mt-2 text-sm text-[#7A8BA8]">Acesso exclusivo para administradores.</p>
        </div>

        <div className="rounded-3xl border border-[#243352] bg-[#111827] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-[#EDF2F7]">E-mail</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8BA8]" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="border-[#243352] bg-[#0A0E1A] pl-10 text-[#EDF2F7]"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[#EDF2F7]">Senha</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8BA8]" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="border-[#243352] bg-[#0A0E1A] pl-10 text-[#EDF2F7]"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[#FF7A00]/25 bg-[#FF7A00]/10 p-3 text-sm font-semibold text-[#FF7A00]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#FF7A00] py-6 text-white hover:bg-[#E06800]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
