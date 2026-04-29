import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

const navigation = {
  navegacao: [
    { name: "Home", href: "/" },
    { name: "Serviços", href: "/servicos" },
    { name: "Projetos", href: "/projetos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ],
  servicos: [
    { name: "Sistemas Web", href: "/servicos#software" },
    { name: "Apps e PWA", href: "/servicos#software" },
    { name: "SaaS", href: "/servicos#software" },
    { name: "Automações", href: "/servicos#automacao" },
    { name: "Infraestrutura", href: "/servicos#hardware" },
    { name: "Hardware IoT", href: "/servicos#hardware" },
  ],
  legal: [
    { name: "Política de Privacidade", href: "/privacidade" },
    { name: "Termos de Uso", href: "/termos" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0A0E1A] border-t border-[#1E2D45]">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Código Base">
              <Image
                src="/logo-oficial.png"
                alt="Código Base — Software & Hardware Solutions"
                width={52}
                height={52}
                className="h-11 w-11 rounded-full object-contain drop-shadow-[0_0_8px_rgba(0,200,232,0.25)]"
              />
              <span className="flex items-center font-heading font-extrabold tracking-[0.04em] text-lg leading-none">
                <span className="text-[#00C8E8]">CÓDIGO</span>
                <span className="text-[#5A7090] mx-px">-</span>
                <span className="text-[#FF7A00]">BASE</span>
              </span>
            </Link>
            <p className="text-sm text-[#7A8BA8] max-w-xs leading-relaxed">
              Software, hardware e automação para empresas que precisam de tecnologia que funciona de verdade.
            </p>
            <div className="flex items-center gap-4">
              <a
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7A8BA8] hover:text-[#00C8E8] transition-colors"
                aria-label="Instagram da Código Base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href={siteConfig.links.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7A8BA8] hover:text-[#00C8E8] transition-colors"
                aria-label="WhatsApp da Código Base"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href={siteConfig.links.email}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7A8BA8] hover:text-[#00C8E8] transition-colors"
                aria-label="E-mail da Código Base"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-[#EDF2F7] mb-4">Navegação</h3>
            <ul className="space-y-3">
              {navigation.navegacao.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[#7A8BA8] hover:text-[#00C8E8] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-[#EDF2F7] mb-4">Serviços</h3>
            <ul className="space-y-3">
              {navigation.servicos.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-[#7A8BA8] hover:text-[#00C8E8] transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-[#EDF2F7] mb-4">Contato direto</h3>
            <ul className="space-y-3">
              <li>
                <a href={siteConfig.links.email} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7A8BA8] hover:text-[#00C8E8] transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a href={siteConfig.links.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7A8BA8] hover:text-[#00C8E8] transition-colors flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {siteConfig.contact.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={siteConfig.links.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-[#7A8BA8] hover:text-[#00C8E8] transition-colors flex items-center gap-2">
                  <span className="text-base">@</span>
                  {siteConfig.contact.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1E2D45] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#3D5068]">
            © {new Date().getFullYear()} Código Base. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            {navigation.legal.map((item) => (
              <Link key={item.name} href={item.href} className="text-sm text-[#3D5068] hover:text-[#00C8E8] transition-colors">
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
