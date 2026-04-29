"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";

const navLinks = [
  { href: "/servicos", label: "Serviços" },
  { href: "/projetos", label: "Projetos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E1A]/85 backdrop-blur-xl border-b border-[#1E2D45]"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="Código Base">
          <Image
            src="/logo-oficial.png"
            alt="Código Base — Software & Hardware Solutions"
            width={52}
            height={52}
            priority
            className="h-11 w-11 rounded-full object-contain drop-shadow-[0_0_8px_rgba(0,200,232,0.25)]"
          />
          <span className="hidden sm:flex items-center font-heading font-extrabold tracking-[0.04em] text-lg leading-none">
            <span className="text-[#00C8E8]">CÓDIGO</span>
            <span className="text-[#5A7090] mx-px">-</span>
            <span className="text-[#FF7A00]">BASE</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#7A8BA8] hover:text-[#00C8E8] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <a
            href={siteConfig.links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-[#FF7A00] hover:bg-[#E06800] text-white text-sm font-semibold transition-colors shadow-[0_0_20px_rgba(255,122,0,0.18)]"
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-[#1E2D45] bg-[#0A0E1A]/95 backdrop-blur-xl"
        >
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#7A8BA8] hover:text-[#00C8E8] transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={siteConfig.links.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-[#FF7A00] hover:bg-[#E06800] text-white text-sm font-semibold transition-colors mt-2"
            >
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </a>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}
