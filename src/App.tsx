import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, MonitorPlay, MessageSquareWarning, Instagram, FileSpreadsheet,
  EyeOff, Cpu, Unplug, Code2, Bot, BarChart3, Megaphone, Wrench, Network,
  LayoutTemplate, Smartphone, GalleryHorizontal, Video, CalendarClock, Target,
  Laptop, Server, CheckCircle2, ShieldCheck, Zap, Users, TrendingUp, Menu, X, ArrowRight,
  MessageCircle, ChevronDown, Check, MousePointerClick, Database, Star, ChevronUp, Mail,
  Headphones, CreditCard, Award, Sun, Moon, Search, ShoppingBag, Calendar, Briefcase, Info,
  Copy, Printer
} from 'lucide-react';
import AdminApp from './AdminApp';

const WA_LINK = "https://wa.me/5511986262240";

// --- CONFIGURAÇÃO DE RASTREAMENTO (PIXEL / GTM) ---
const TRACKING_CONFIG = {
  pixelId: "FB-PIXEL-9876543210", // ID fictício personalizável do Facebook Pixel
  gtmId: "GTM-KB8276X",            // ID fictício personalizável do Google Tag Manager
  enableConsoleLog: true,          // Imprime eventos de conversão no console para verificação em tempo real
};

// Utilitário global para disparar eventos de rastreamento para Facebook Pixel e GTM
const trackConversion = (eventName: string, details?: Record<string, any>) => {
  if (TRACKING_CONFIG.enableConsoleLog) {
    console.log(
      `[Tracking] Evento disparado: %c${eventName}`, 
      "color: #00D9FF; font-weight: bold; background: rgba(0, 217, 255, 0.1); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(0, 217, 255, 0.2);", 
      details
    );
  }

  // Integrando com o Pixel do Facebook se disponível no escopo global (Ex: fbq)
  if (typeof (window as any).fbq !== "undefined") {
    (window as any).fbq("trackCustom", eventName, details);
  }

  // Integrando com o Google Tag Manager (dataLayer) se disponível no escopo global
  if (typeof (window as any).dataLayer !== "undefined") {
    (window as any).dataLayer.push({
      event: eventName,
      eventDetails: details,
    });
  }
};

// --- Data ---
const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Marketing', href: '#marketing' },
  { label: 'Sistemas', href: '#sistemas' },
  { label: 'Suporte', href: '#suporte' },
  { label: 'Pacotes', href: '#pacotes' },
  { label: 'Simulador', href: '#simulador' },
];

const PAIN_POINTS = [
  { icon: MessageSquareWarning, title: "Atendimento lento no WhatsApp", desc: "Enquanto você demora para responder, o concorrente fecha." },
  { icon: Instagram, title: "Instagram bonito, mas sem vendas", desc: "Postar sem estratégia não transforma seguidores em clientes." },
  { icon: FileSpreadsheet, title: "Planilhas e processos manuais", desc: "Quanto mais manual, mais retrabalho e menos escala." },
  { icon: EyeOff, title: "Falta de visão dos números", desc: "Sem dashboard, você decide no achismo." },
  { icon: Cpu, title: "Computadores lentos", desc: "Hardware ruim custa produtividade todos os dias." },
  { icon: Unplug, title: "Sistemas desconectados", desc: "ERP, financeiro, vendas e atendimento precisam conversar." }
];

const SERVICES = [
  {
    icon: Code2, title: "Desenvolvimento e Sistemas",
    items: ["Sistemas SaaS personalizados", "Sites profissionais", "Apps PWA", "Lojas virtuais", "Integrações com APIs", "Integração ERPs/Protheus"]
  },
  {
    icon: Bot, title: "Inteligência Artificial",
    items: ["Agentes de IA", "Chatbot IA WhatsApp 24h", "Automações inteligentes", "Fluxos de atendimento", "Qualificação de leads", "Automação de tarefas"]
  },
  {
    icon: BarChart3, title: "Dados e Dashboards",
    items: ["Dashboards com Power BI", "SQL & Databricks", "Indicadores de vendas", "Relatórios automatizados", "Gestão por dados"]
  },
  {
    icon: Megaphone, title: "Marketing Digital",
    items: ["Criação de posts profissionais", "Stories & Carrosséis", "Vídeos e Imagens comerciais", "Gestão Instagram com IA", "Automação de postagens"]
  },
  {
    icon: Wrench, title: "Hardware e Suporte",
    items: ["Manutenção desktops/notebooks", "Formatação & Limpeza", "Remoção de vírus", "Upgrade SSD/RAM", "Diagnóstico técnico"]
  },
  {
    icon: Network, title: "Infraestrutura e Redes",
    items: ["Redes corporativas", "Firewall OPNsense/pfSense", "Active Directory", "VLANs & NAT", "Suporte técnico N2 e N3"]
  }
];

const PACKAGES = [
  {
    title: "Pacote Start Digital", price: "A partir de R$ 197",
    features: ["Bio otimizada", "6 artes profissionais", "3 stories", "1 carrossel", "CTA para WhatsApp"],
    btnText: "Quero começar"
  },
  {
    title: "Pacote Insta Profissional", price: "A partir de R$ 397", isPopular: true,
    features: ["10 artes profissionais", "5 stories", "2 carrosséis", "Calendário de 7 dias", "Capa de destaques", "Estratégia de conteúdo"],
    btnText: "Quero meu Instagram profissional"
  },
  {
    title: "Pacote Automação e IA", price: "A partir de R$ 797",
    features: ["Chatbot IA", "Fluxo de atendimento", "Qualificação de leads", "Integração com WhatsApp", "Respostas automáticas", "Configuração inicial"],
    btnText: "Quero automatizar"
  },
  {
    title: "Sistema Personalizado", price: "Sob orçamento",
    features: ["Sistema SaaS", "Painel administrativo", "Banco de dados", "Relatórios & Dashboard", "Login de usuários", "Hospedagem inclusa"],
    btnText: "Solicitar orçamento"
  }
];

const FAQS = [
  { q: "Vocês criam posts e carrosséis para Instagram?", a: "Sim. Criamos posts, stories, carrosséis, imagens comerciais e vídeos curtos, tudo focado na identidade da sua marca." },
  { q: "Vocês conseguem automatizar postagens?", a: "Sim. Podemos configurar automações para programar e publicar conteúdos estrategicamente para você." },
  { q: "Vocês criam sistemas personalizados?", a: "Sim. Criamos sistemas SaaS, painéis administrativos, dashboards integrados e fazemos conexão com APIs." },
  { q: "Vocês criam chatbot para WhatsApp?", a: "Sim. Criamos fluxos de atendimento automático com IA para qualificar leads e atender 24h." },
  { q: "Vocês também fazem manutenção de computadores?", a: "Sim. Atendemos a parte de hardware, upgrades, limpeza, redes e suporte técnico avançado." },
  { q: "Atendem empresas pequenas?", a: "Sim. Criamos soluções sob medida para autônomos, negócios locais, clínicas, restaurantes e empresas em geral." }
];

const TESTIMONIALS = [
  {
    name: "Adriano Mendes",
    role: "Diretor de Operações",
    company: "Mendes Consultoria & Logística",
    feedback: "A Código-Base implementou o nosso chatbot de WhatsApp e sistemas integrados. Nosso tempo de resposta caiu de horas para segundos, e as vendas cresceram mais de 45% logo no primeiro mês. Uma solução extremamente robusta e segura.",
    rating: 5,
    avatar: "AM"
  },
  {
    name: "Carolina Vasconcellos",
    role: "Diretora de Marketing",
    company: "Clínica Vasconcellos Odonto",
    feedback: "Nossos posts do Instagram agora parecem dignos de uma grande marca e a automação de leads mudou o jogo. O atendimento humano da Código-Base e a dedicação deles com o design do nosso PWA superaram todas as expectativas.",
    rating: 5,
    avatar: "CV"
  },
  {
    name: "Felipe Goulart",
    role: "Fundador & CEO",
    company: "Goulart SaaS Platform",
    feedback: "Eles desenharam nossa plataforma SaaS de ponta a ponta com dashboards no Power BI impecáveis. O visual é incrivelmente limpo e moderno. Recomendo fortemente para qualquer empresa que queira elevar o nível tecnológico.",
    rating: 5,
    avatar: "FG"
  }
];

const SUCCESS_CASES = [
  {
    client: "Deluxe Cosméticos",
    industry: "E-commerce de Beleza",
    category: "E-commerce",
    description: "Automação inteligente de recuperação de carrinhos abandonados no WhatsApp e personalização automática de ofertas direcionadas.",
    metrics: [
      { label: "Custo por Lead", before: "R$ 14,50", after: "R$ 10,15", change: "-30%", isPositive: true, type: "cost", tooltip: "Calculado dividindo o investimento total em anúncios Meta Ads pelo número de leads qualificados capturados no funil automatizado." },
      { label: "Vendas Totais", before: "420/mês", after: "630/mês", change: "+50%", isPositive: true, type: "sales", tooltip: "Mensurado via integração direta da API do WhatsApp com o painel da Shopify, registrando vendas de carrinhos abandonados recuperados." }
    ],
    icon: "ShoppingBag"
  },
  {
    client: "Clínica Sorelli",
    industry: "Estética & Saúde Premium",
    category: "Saúde",
    description: "Integração de agente virtual por voz/texto com IA atendendo 24/7 de forma humanizada e sincronia direta com Google Agenda.",
    metrics: [
      { label: "Consultas Agendadas", before: "110/mês", after: "192/mês", change: "+75%", isPositive: true, type: "appointments", tooltip: "Analisado pelo número de novos horários reservados no Google Agenda diretamente pela assistente de Inteligência Artificial." },
      { label: "Tempo de Resposta", before: "35 min", after: "Imediato", change: "Sub-segundo", isPositive: true, type: "time", tooltip: "Tempo médio medido entre a mensagem de entrada do cliente no WhatsApp e a resposta do agente inteligente com IA." }
    ],
    icon: "Calendar"
  },
  {
    client: "Vectra Advogados Associados",
    industry: "Setor Jurídico & Compliance",
    category: "Jurídico",
    description: "Triagem automatizada de petições, leitura inteligente de PDFs por IA e preenchimento de documentos em lote.",
    metrics: [
      { label: "Horas de Backoffice", before: "18h/sem", after: "3,6h/sem", change: "-80%", isPositive: true, type: "hours", tooltip: "Mensurado comparando o tempo manual gasto para triagem e preenchimento de petições versus o processamento em lote da IA." },
      { label: "Capacidade de Casos", before: "45/sem", after: "90/sem", change: "+100%", isPositive: true, type: "capacity", tooltip: "Aumento de capacidade operacional medido pelo volume de novos atendimentos simultâneos suportados pela infraestrutura de IA." }
    ],
    icon: "Briefcase"
  }
];

const SIMULATOR_SERVICES = [
  {
    id: "saas",
    title: "Sistemas & Apps (SaaS/PWA)",
    desc: "Sistemas web sob medida, automação de planilhas e banco de dados seguros.",
    icon: Code2,
    price: 1800,
    hoursSaved: 15,
    conversionBoost: 20,
    metrics: "Adeus retrabalhos e tarefas manuais demoradas"
  },
  {
    id: "bot",
    title: "Conversão IA & Chatbot 24/7",
    desc: "Agentes inteligentes no WhatsApp para responder e qualificar leads em segundos.",
    icon: Bot,
    price: 850,
    hoursSaved: 20,
    conversionBoost: 35,
    metrics: "Tempo de resposta cai de minutos para imediato"
  },
  {
    id: "mkt",
    title: "Presença & Instagram Comercial",
    desc: "Posts e carrosséis premium criados com estratégia técnica de funil.",
    icon: Megaphone,
    price: 450,
    hoursSaved: 8,
    conversionBoost: 15,
    metrics: "Artes profissionais alinhadas ao seu posicionamento"
  },
  {
    id: "bi",
    title: "Dados & Dashboards Power BI",
    desc: "Centralização de vendas e indicadores financeiros em tempo real.",
    icon: BarChart3,
    price: 600,
    hoursSaved: 12,
    conversionBoost: 10,
    metrics: "Decisões orientadas a métricas reais, sem 'achismo'"
  },
  {
    id: "infra",
    title: "Hardware, Redes & pfSense",
    desc: "Segurança de firewall, upgrades SSD/RAM e prevenção técnica de lentidões.",
    icon: Server,
    price: 350,
    hoursSaved: 6,
    conversionBoost: 5,
    metrics: "Infraestrutura corporativa contra travamentos e roubo de dados"
  }
];

const QUIZ_QUESTIONS = [
  {
    question: "Como sua empresa faz o atendimento inicial de leads/clientes pelo WhatsApp?",
    options: [
      { text: "Atendimento disperso, lento e informal (perdemos clientes para concorrentes ágeis)", pts: 10 },
      { text: "Atendente humano ágil (mas apenas em horário comercial, fins de semana e noites ficam descobertos)", pts: 50 },
      { text: "Menu básico de direcionamento ('Digite 1 para...'), porém engessado e sem resposta imediata", pts: 60 },
      { text: "Dispomos de inteligência artificial ou chatbot customizado que atende e qualifica perfeitamente 24/7", pts: 100 }
    ]
  },
  {
    question: "Qual o nível visual, estratégico e de captação de clientes do seu Instagram comercial?",
    options: [
      { text: "Não temos presença ativa, perfil está desatualizado ou abandonado", pts: 10 },
      { text: "Fazemos postagens frequentes, porém com visual amador e sem estratégia clara de conversão", pts: 40 },
      { text: "Design bonito e elegante, mas sem consistência por falta de tempo ou equipe focada", pts: 65 },
      { text: "Visual premium impressionante com calendário estratégico integrado de geração de leads", pts: 100 }
    ]
  },
  {
    question: "Como a diretoria e gestão tomam decisões estratégicas ou enxergam as finanças da empresa?",
    options: [
      { text: "Sem relatórios unificados. Decidimos na base da intuição dos gestores", pts: 10 },
      { text: "Dependemos de planilhas de Excel complexas e manuais que vivem desatualizadas ou travando", pts: 45 },
      { text: "Analisamos relatórios do ERP, mas sem visualização dinâmica ou cruzamento inteligente de dados", pts: 65 },
      { text: "Dashboards visuais integrados (Power BI/dashboards em nuvem) atualizados automaticamente", pts: 100 }
    ]
  },
  {
    question: "Como você avalia a segurança, velocidade dos computadores e estabilidade de TI da empresa?",
    options: [
      { text: "Computadores lentos e travando, sem antivírus, backups estruturados ou firewall ativo", pts: 10 },
      { text: "Computadores bons, mas a rede local oscila muito (Wi-Fi instável) e sem proteção extra contra vírus", pts: 45 },
      { text: "Equipamentos e rede funcionando bem, mas sem suporte técnico dedicado ou governança rápida de incidentes", pts: 70 },
      { text: "Infraestrutura excelente com firewalls (pfsense, etc.), backup em nuvem e desktops rápidos com upgrades", pts: 100 }
    ]
  }
];

// --- Components ---

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
}

const FadeIn = ({ children, delay = 0, className = "" }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;
    
    // Max rotation 8 degrees
    const rX = -(mouseY / (height / 2)) * 8;
    const rY = (mouseX / (width / 2)) * 8;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'scale3d(1.05, 1.05, 1.05)' : 'scale3d(1, 1, 1)'}`,
        transition: rotateX === 0 && rotateY === 0 ? "transform 0.4s ease, box-shadow 0.4s ease" : "transform 0.05s ease-out, box-shadow 0.4s ease",
        transformStyle: "preserve-3d",
      }}
      className={`transform-gpu transition-all duration-300 ${className} ${isHovered ? 'shadow-[0_25px_60px_-15px_rgba(0,217,255,0.3)] border-brand-cyan/40 z-30' : ''}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, href, primary = true, className = "", onClick }: any) => {
  const baseClass = "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-medium transition-all duration-300 font-sans cursor-pointer select-none";
  const primaryClass = "bg-brand-cyan hover:bg-[#00c2eB] text-brand-black shadow-[0_0_20px_rgba(0,217,255,0.4)] hover:shadow-[0_0_30px_rgba(0,217,255,0.6)] hover:-translate-y-1";
  const secondaryClass = "bg-brand-gray border border-white/10 hover:border-brand-cyan/50 text-brand-white hover:bg-brand-gray/80 hover:-translate-y-1";
  
  const handleClick = (e: any) => {
    if (href && (href === WA_LINK || href.includes("wa.me"))) {
      trackConversion("ClickWhatsApp", { 
        buttonText: children ? children.toString() : "Falar no WhatsApp",
        href
      });
    }
    if (onClick) {
      onClick(e);
    }
  };

  if (href) {
    return (
      <a 
        href={href} 
        onClick={handleClick}
        target={href.startsWith('http') ? "_blank" : undefined} 
        rel="noopener noreferrer" 
        className={`${baseClass} ${primary ? primaryClass : secondaryClass} ${className}`}
      >
        {children}
      </a>
    );
  }
  return (
    <button 
      onClick={handleClick} 
      className={`${baseClass} ${primary ? primaryClass : secondaryClass} ${className}`}
    >
      {children}
    </button>
  );
};

const AnimatedCounter = ({ value, duration = 1.6, delay = 0, formatting = (n: number) => n.toString() }: { value: number; duration?: number; delay?: number; formatting?: (n: number) => string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    if (elementRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
            const easeProgress = progress * (2 - progress); // easeOutQuad
            setCount(easeProgress * value);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          setTimeout(() => {
            window.requestAnimationFrame(step);
          }, delay * 1000);
        }
      }, { threshold: 0.1 });
      observer.observe(elementRef.current);
    }
    return () => {
      if (observer && elementRef.current) observer.unobserve(elementRef.current);
    };
  }, [value, duration, delay, hasAnimated]);

  return <span ref={elementRef}>{formatting(count)}</span>;
};

const RANDOM_NOTIFICATIONS = [
  { name: "Rafael S.", city: "São Paulo", service: "Chatbot de WhatsApp IA" },
  { name: "Mariana K.", city: "Curitiba", service: "Desenvolvimento de PWA" },
  { name: "Lucas M.", city: "Belo Horizonte", service: "Dashboard no Power BI" },
  { name: "Ana Beatriz C.", city: "Campinas", service: "Gestão do Instagram IA" },
  { name: "Felipe G.", city: "Rio de Janeiro", service: "Sistema SaaS Personalizado" },
  { name: "Clínica V.", city: "Porto Alegre", service: "Automação Integrada" },
  { name: "Rodrigo T.", city: "Joinville", service: "Infraestrutura de Rede e pfSense" }
];

// --- Main App ---
export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return <AdminApp />;
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme support
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme !== 'light';
    }
    return true;
  });

  // Scroll position state for Parallax Effect
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [leadEmailError, setLeadEmailError] = useState("");

  // States for Toast Notification
  const [toast, setToast] = useState<{ name: string; city: string; service: string } | null>(null);
  const [showToast, setShowToast] = useState(false);

  // States for Quick Quote Modal
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteService, setQuoteService] = useState("Sistemas & Apps Personalizados");
  const [quoteUrgency, setQuoteUrgency] = useState("⚡ Urgência Máxima");
  const [quoteName, setQuoteName] = useState("");
  const [quoteNameTouched, setQuoteNameTouched] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState("");
  const [faqSearch, setFaqSearch] = useState("");
  const [activeCaseTab, setActiveCaseTab] = useState("Todos");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [isWaWidgetOpen, setIsWaWidgetOpen] = useState(false);
  const [showWaBubble, setShowWaBubble] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  // --- SMART TECH SIMULATOR & DIAGNOSTIC QUIZ STATES ---
  const [simSelectedServices, setSimSelectedServices] = useState<Record<string, boolean>>({
    saas: true,
    bot: true,
    mkt: false,
    bi: false,
    infra: false,
  });
  const [simLeadsPerMonth, setSimLeadsPerMonth] = useState(150);
  const [simWastedHours, setSimWastedHours] = useState(12);
  const [simResponseDelay, setSimResponseDelay] = useState(30);
  const [simTab, setSimTab] = useState<"calculator" | "quiz">("calculator");

  // Quiz States
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowCopyNotification(true);
      trackConversion("page_link_copied", { url: window.location.href });
      setTimeout(() => {
        setShowCopyNotification(false);
      }, 3000);
    }).catch(err => {
      console.error("Falha ao copiar link:", err);
    });
  };

  // Trigger WhatsApp welcome message popup with an elegant delay
  useEffect(() => {
    const bubbleTimer = setTimeout(() => {
      setShowWaBubble(true);
    }, 4000);
    return () => clearTimeout(bubbleTimer);
  }, []);

  // Simulated content pre-loading to trigger the skeleton animation 
  useEffect(() => {
    const timer = setTimeout(() => {
      setServicesLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 600);
      setScrollY(window.scrollY);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effect to handle periodic toast notifications for social proof/urgency
  useEffect(() => {
    let timeoutId: any;
    let intervalId: any;

    const triggerToast = () => {
      const randomItem = RANDOM_NOTIFICATIONS[Math.floor(Math.random() * RANDOM_NOTIFICATIONS.length)];
      setToast(randomItem);
      setShowToast(true);
      
      // Hide after 6 seconds
      timeoutId = setTimeout(() => {
        setShowToast(false);
      }, 6000);
    };

    // Show first toast after 5 seconds
    const firstTimeout = setTimeout(() => {
      triggerToast();
    }, 5000);

    // Repeat every 24 seconds
    intervalId = setInterval(() => {
      triggerToast();
    }, 24000);

    return () => {
      clearTimeout(firstTimeout);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail || !leadName) return;

    // Email validation using a robust Regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadEmail.trim())) {
      setLeadEmailError("Por favor, insira um endereço de e-mail válido (ex: seu_nome@empresa.com).");
      return;
    }

    setLeadEmailError("");
    setIsSubmitting(true);
    // Simulate premium validation and API send
    setTimeout(() => {
      setIsSubmitting(false);
      setIsFormSubmitted(true);
    }, 1000);
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteNameTouched(true);
    if (!quoteName.trim()) {
      return;
    }

    const formattedMessage = `Olá, gostaria de solicitar um orçamento rápido pelo site:
- *Nome*: ${quoteName}
- *Serviço Selecionado*: ${quoteService}
- *Nível de Urgência*: ${quoteUrgency}
- *Detalhes do Projeto*: ${quoteDetails.trim() || 'Não especificado.'}`;

    const link = `https://wa.me/5511986262240?text=${encodeURIComponent(formattedMessage)}`;

    const a = document.createElement('a');
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();

    // Reset and close
    setIsQuoteModalOpen(false);
    setQuoteNameTouched(false);
    setQuoteName("");
    setQuoteDetails("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="font-sans selection:bg-brand-cyan/30 selection:text-white pb-20 md:pb-0">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        id="scroll-progress-bar"
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-orange z-[9999] origin-left" 
        style={{ scaleX: scrollProgress / 100 }}
      />
      
      {/* Background Elements */}
      <div className="fixed inset-0 z-[-1] bg-grid-pattern opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-cyan/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-orange/10 blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-panel py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#inicio" className="relative flex items-center gap-3 focus:outline-none group">
              {/* Premium pulsing and rotating aura glow behind current logo */}
              <div className="absolute -inset-2 bg-gradient-to-r from-brand-cyan/35 to-brand-orange/35 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-soft pointer-events-none"></div>
              <div className="absolute -inset-1 bg-gradient-to-tr from-brand-cyan to-brand-orange rounded-full blur-md opacity-25 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500 animate-[spin_12s_linear_infinite] pointer-events-none"></div>
              
              <img 
                src="/logo.png" 
                alt="Código-Base Logo" 
                className="relative z-10 h-22 md:h-30 w-auto object-contain filter contrast-125 brightness-105 select-none transition-transform duration-300 group-hover:scale-105"
                style={{ imageRendering: 'auto' }}
                onError={(e) => {
                  // Fallback to text brand if image fails to load or during configuration phase
                  e.currentTarget.style.display = 'none';
                  const container = e.currentTarget.parentElement;
                  if (container && !container.querySelector('.text-fallback')) {
                    const el = document.createElement('div');
                    el.className = 'text-fallback flex flex-col relative z-10';
                    el.innerHTML = '<span class="font-display font-bold text-2xl md:text-3xl leading-none text-white tracking-tight">CÓDIGO-BASE</span><span class="text-[10px] md:text-xs uppercase tracking-widest text-[#00D9FF] font-mono mt-1">Software & Hardware</span>';
                    container.appendChild(el);
                  }
                }}
              />
            </a>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors">
                {link.label}
              </a>
            ))}
          </nav>
          
          {/* Theme Switcher & Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-brand-cyan/40 hover:bg-white/10 text-brand-cyan hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center shadow-lg print:hidden"
              aria-label="Copiar Link"
              title="Copiar Link da Página"
            >
              <Copy size={18} />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-brand-cyan/40 hover:bg-white/10 text-brand-cyan hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center shadow-lg print:hidden"
              aria-label="Toggle Theme"
              title={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {isDarkMode ? <Sun size={18} className="animate-[spin_20s_linear_infinite]" /> : <Moon size={18} className="text-brand-orange animate-pulse" />}
            </button>

            <div className="hidden lg:block">
              <Button href={WA_LINK} className="!py-2.5 !px-5 text-sm">
                Falar no WhatsApp
              </Button>
            </div>

            <button className="lg:hidden text-white hover:text-brand-cyan transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden glass-panel border-t border-white/5 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                {NAV_LINKS.map(link => (
                  <a key={link.label} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-200">
                    {link.label}
                  </a>
                ))}
                <Button href={WA_LINK} className="w-full mt-4">
                  Falar no WhatsApp
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copy Link Toast Notification */}
        <AnimatePresence>
          {showCopyNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-24 right-6 z-[60] bg-brand-cyan border border-brand-cyan/50 text-brand-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-sans font-semibold text-sm cursor-pointer"
              onClick={() => setShowCopyNotification(false)}
            >
              <CheckCircle2 size={16} />
              <span>Link copiado para a área de transferência!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* --- HERO SECTION --- */}
        <section id="inicio" className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden min-h-[90vh] flex items-center justify-center">
          {/* Full Screen Lux Hero Video with Parallax effect */}
          <div 
             style={{ transform: `translateY(${scrollY * 0.15}px)` }}
             className="absolute inset-x-0 top-0 h-full z-0 pointer-events-none overflow-hidden select-none transform-gpu"
          >
            <video 
              src="/hero-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-50 filter brightness-90 contrast-105"
            />
            {/* Cinematic luxury gradients that keep text fully legible while letting the tech details shine */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#05070D]/80 via-transparent to-[#05070D]"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#05070D]/85 via-transparent to-[#05070D]/50"></div>
          </div>

          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="flex flex-col items-start z-10">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono mb-6 backdrop-blur-md">
                  <Zap size={14} className="fill-brand-cyan" /> Soluções completas em TI e Marketing
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6 drop-shadow-2xl">
                  Tecnologia, IA e Marketing para fazer seu negócio <span className="text-gradient drop-shadow-[0_0_15px_rgba(0,217,255,0.3)]">vender mais</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl font-light drop-shadow-lg">
                  A Código-Base cria sistemas, sites, automações, dashboards, conteúdos para Instagram, chatbots e soluções de hardware para empresas que querem crescer com eficácia.
                </p>
              </FadeIn>
              <FadeIn delay={0.3} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button href={WA_LINK} className="group backdrop-blur-sm">
                  Quero uma solução para minha empresa
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button href="#servicos" primary={false} className="backdrop-blur-sm bg-white/5">
                  Ver serviços
                </Button>
              </FadeIn>
            </div>

            <FadeIn delay={0.4} className="relative z-10 w-full lg:h-[600px] flex items-center justify-center">
               {/* Visual Composition Floating Over Video */}
               <div className="relative w-full max-w-lg mx-auto aspect-square md:h-[500px] flex items-center justify-center">
                  
                  {/* Glowing Animated Circular Background Rings for Luxury Effect */}
                  <div className="absolute w-[85%] h-[85%] rounded-full border border-brand-cyan/10 animate-[spin_40s_linear_infinite] opacity-60"></div>
                  <div className="absolute w-[95%] h-[95%] rounded-full border border-dashed border-brand-orange/10 animate-[spin_60s_linear_infinite_reverse] opacity-50"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-cyan/10 rounded-full blur-[80px] animate-pulse-soft"></div>
                  
                  {/* Dashboard Mock Container */}
                  <div className="relative z-10 w-full h-full max-w-md aspect-square md:h-[450px] glass-card rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,217,255,0.15)] flex flex-col backdrop-blur-md">
                    {/* Header bar */}
                    <div className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-black/40">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">CÓDIGO-BASE V1.0</div>
                    </div>
                    
                    {/* Body */}
                    <div className="flex-1 p-6 flex flex-col justify-between bg-[#08111F]/30">
                      {/* Top stat banner */}
                      <div className="h-28 rounded-2xl bg-gradient-to-r from-brand-cyan/10 via-brand-cyan/5 to-transparent border border-brand-cyan/20 p-4 relative overflow-hidden flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-brand-cyan font-mono tracking-widest uppercase mb-1">Taxa de Conversão Geral</p>
                          <p className="text-3xl font-display font-bold"><AnimatedCounter value={184.2} formatting={(v) => "+" + v.toFixed(1) + "%"} /></p>
                        </div>
                        <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          ia_agent_online
                        </div>
                        <TrendingUp className="absolute top-4 right-4 text-brand-cyan/40" size={36} />
                      </div>

                      {/* Middle Grid */}
                      <div className="grid grid-cols-2 gap-4 my-2">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-gray-400 text-[10px] font-mono uppercase">Vendas Hoje</span>
                          <span className="text-xl font-display font-semibold mt-1"><AnimatedCounter value={4250} formatting={(v) => "R$ " + Math.floor(v).toLocaleString('pt-BR')} /></span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                          <span className="text-gray-400 text-[10px] font-mono uppercase">Infra/pfSense</span>
                          <span className="text-xs font-mono text-green-400 mt-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> 100% ONLINE
                          </span>
                        </div>
                      </div>

                      {/* Mini Live Chat simulator inside dashboard */}
                      <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange">
                          <Bot size={16} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[9px] text-gray-500 font-mono">Chatbot Ativo</p>
                          <p className="text-xs text-gray-300 truncate">"Olá! Vi que você quer alavancar..."</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Tags */}
                  <motion.div animate={{y: [0, -15, 0]}} transition={{repeat: Infinity, duration: 6, ease: "easeInOut"}} className="absolute -top-6 -right-6 glass-card px-4 py-3 rounded-xl flex items-center gap-3 border-brand-cyan/30 shadow-[0_0_15px_rgba(0,217,255,0.15)] z-25 tooltip-glow">
                    <Bot className="text-brand-cyan" size={18} />
                    <span className="font-mono text-sm">Chatbot IA 24h</span>
                  </motion.div>
                  
                  <motion.div animate={{y: [0, 15, 0]}} transition={{repeat: Infinity, duration: 5, delay: 1, ease: "easeInOut"}} className="absolute top-1/4 -left-12 glass-card px-4 py-3 rounded-xl flex items-center gap-3 border-brand-orange/30 shadow-[0_0_15px_rgba(255,122,0,0.15)] z-25">
                    <LayoutTemplate className="text-brand-orange" size={18} />
                    <span className="font-mono text-sm">Sites e Apps</span>
                  </motion.div>

                   <motion.div animate={{y: [0, -10, 0]}} transition={{repeat: Infinity, duration: 4, delay: 2, ease: "easeInOut"}} className="absolute bottom-1/4 right-[-2rem] glass-card px-4 py-3 rounded-xl flex items-center gap-3 border-white/20 z-25 backdrop-blur-xl">
                    <Database className="text-purple-400" size={18} />
                    <span className="font-mono text-sm">Power BI</span>
                  </motion.div>

                  <motion.div animate={{y: [0, 10, 0]}} transition={{repeat: Infinity, duration: 5.5, delay: 0.5, ease: "easeInOut"}} className="absolute -bottom-8 left-10 glass-card px-4 py-3 rounded-xl flex items-center gap-3 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] z-25">
                    <Instagram className="text-pink-400" size={18} />
                    <span className="font-mono text-sm">Instagram IA</span>
                  </motion.div>
               </div>
            </FadeIn>
          </div>
        </section>

        {/* --- SELO DE CONFIANÇA SECTION --- */}
        <section className="py-12 border-y border-white/5 bg-brand-black/20 backdrop-blur-md relative overflow-hidden z-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: Headphones,
                  title: "Suporte 24/7",
                  desc: "Urgência respondida em minutos direto no WhatsApp."
                },
                {
                  icon: ShieldCheck,
                  title: "Segurança de Dados",
                  desc: "Sistemas e backups protegidos ponta a ponta."
                },
                {
                  icon: CreditCard,
                  title: "Pagamento Seguro",
                  desc: "Contrato formalizado e parcelamento facilitado."
                },
                {
                  icon: Award,
                  title: "Garantia de Satisfação",
                  desc: "Entrega impecável com validação contínua."
                }
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] hover:border-brand-cyan/20 transition-all duration-300">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-brand-cyan/10 to-brand-orange/5 text-brand-cyan border border-brand-cyan/10">
                    <badge.icon size={22} className="shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-base">{badge.title}</h4>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PAIN POINTS SECTION --- */}
        <section className="py-24 px-6 border-t border-white/5 bg-[#05070D]">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-4xl font-semibold mb-6">Sua empresa está perdendo clientes por falta de tecnologia?</h2>
              <p className="text-gray-400">Pequenos atrasos, processos manuais e falta de dados custam caro todos os meses.</p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PAIN_POINTS.map((pain, idx) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <div className="glass-card p-8 rounded-2xl h-full group hover:-translate-y-2 transition-all duration-300 hover:border-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 text-red-400 group-hover:scale-110 transition-transform">
                      <pain.icon size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{pain.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mt-auto">"{pain.desc}"</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- MAIN SERVICES --- */}
        <section id="servicos" className="py-24 px-6 relative">
          <div className="absolute top-1/3 left-0 w-96 h-96 bg-brand-cyan/5 rounded-full blur-[150px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <FadeIn className="mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6">O que a Código-Base faz <br/><span className="text-brand-cyan">por você</span></h2>
              <p className="text-gray-400 max-w-2xl">Resolvemos de ponta a ponta: do código do seu sistema à manutenção do seu computador, passando pelo marketing da sua empresa.</p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {servicesLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className="glass-card p-8 rounded-2xl h-full border border-white/5 relative overflow-hidden flex flex-col justify-between animate-pulse"
                  >
                    {/* Simulated pulse light reflection glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none" />
                    <div>
                      {/* Icon Shimmer circle */}
                      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 mb-6 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-md bg-white/10 animate-pulse" />
                      </div>
                      {/* Title Shimmer lines */}
                      <div className="h-6 w-8/12 bg-white/10 rounded mb-6 animate-pulse" />
                      
                      {/* Item list bullet Shimmers */}
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 shrink-0" />
                            <div className="h-3 bg-white/10 rounded w-11/12 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Bottom subtle bar indicator mimicking normal behavior */}
                    <div className="h-1 w-1/3 bg-brand-cyan/10 rounded mt-8" />
                  </div>
                ))
              ) : (
                SERVICES.map((srv, idx) => (
                  <FadeIn key={idx} delay={idx * 0.1}>
                    <TiltCard className="glass-card p-8 rounded-2xl h-full border-t-2 border-t-transparent hover:border-t-brand-cyan transition-colors duration-500">
                      <div className="w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-6 border border-brand-cyan/20">
                         <srv.icon className="text-brand-cyan" size={28} />
                      </div>
                      <h3 className="text-2xl font-display font-semibold mb-6">{srv.title}</h3>
                      <motion.ul 
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="space-y-3"
                      >
                        {srv.items.map((item, i) => (
                          <motion.li 
                            variants={staggerItem}
                            key={item} 
                            className="flex items-start gap-3 text-sm text-gray-300"
                          >
                            <CheckCircle2 size={16} className="text-brand-cyan mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </TiltCard>
                  </FadeIn>
                ))
              )}
            </div>
          </div>
        </section>

        {/* --- MARKETING SECTION --- */}
        <section id="marketing" className="py-24 px-6 bg-brand-gray/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5 relative">
                   <FadeIn className="sticky top-32">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono mb-6">
                        Marketing Digital
                     </div>
                     <h2 className="font-display text-4xl font-semibold mb-6">Seu Instagram precisa parecer profissional e gerar clientes</h2>
                     <p className="text-gray-400 mb-8 text-lg">A Código-Base cria artes, posts, stories, carrosséis, vídeos e conteúdos estratégicos para deixar seu perfil mais forte, organizado e pronto para vender.</p>
                     <Button href={WA_LINK}>Quero meu Instagram mais profissional</Button>
                   </FadeIn>
                </div>
                <div className="lg:col-span-7">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {icon: LayoutTemplate, t: "Posts profissionais", d: "Conteúdos visuais com identidade da sua marca."},
                        {icon: Smartphone, t: "Stories diários", d: "Artes para manter presença ativa todos os dias."},
                        {icon: GalleryHorizontal, t: "Carrosséis estratégicos", d: "Conteúdo que educa, prende atenção e gera autoridade."},
                        {icon: Video, t: "Vídeos para Reels", d: "Roteiros com storytelling, dor, solução e CTA."},
                        {icon: CalendarClock, t: "Automação", d: "Publicações programadas para seu Instagram trabalhar por você."},
                        {icon: Target, t: "Estratégia de conversão", d: "Bio, CTA, WhatsApp e funil para atenção em contato."}
                      ].map((item, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                           <div className="glass-card p-6 rounded-xl hover:bg-white/[0.03] transition-colors">
                              <item.icon className="text-brand-orange mb-4" size={28} />
                              <h4 className="font-semibold text-lg mb-2">{item.t}</h4>
                              <p className="text-sm text-gray-400">{item.d}</p>
                           </div>
                        </FadeIn>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* --- SISTEMAS SECTION --- */}
        <section id="sistemas" className="py-24 px-6 relative overflow-hidden">
           <div className="absolute right-0 top-1/2 w-[500px] h-[500px] bg-brand-cyan/10 blur-[200px] rounded-full pointer-events-none"></div>
           <div className="max-w-7xl mx-auto">
             <div className="text-center max-w-3xl mx-auto mb-16">
               <FadeIn>
                  <h2 className="font-display text-4xl font-semibold mb-6">Pare de depender de planilhas, papel e improviso</h2>
                  <p className="text-gray-400 text-lg">Criamos sistemas personalizados para organizar sua empresa, automatizar processos e centralizar tudo em um painel simples e profissional.</p>
               </FadeIn>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <FadeIn className="order-2 lg:order-1 glass-card p-2 rounded-2xl border-brand-cyan/20 shadow-2xl relative">
                  <div className="absolute -top-4 -left-4 bg-brand-cyan text-brand-black px-4 py-1 text-sm font-bold rounded-lg transform -rotate-2">Painel de Controle</div>
                  <div className="bg-brand-black rounded-xl p-6 border border-white/5">
                     <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                        <div className="font-display text-xl font-medium tracking-wide">Visão Geral</div>
                        <div className="flex gap-2">
                           <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                           <span className="w-2 h-2 rounded-full bg-brand-orange"></span>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-lg">
                           <div className="text-gray-400 text-xs font-mono uppercase">Vendas do mês</div>
                           <div className="text-2xl font-display font-bold mt-1 text-brand-white"><AnimatedCounter value={42.5} formatting={(v) => "R$ " + v.toFixed(1) + "K"} /></div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                           <div className="text-gray-400 text-xs font-mono uppercase">Clientes ativos</div>
                           <div className="text-2xl font-display font-bold mt-1 text-brand-cyan"><AnimatedCounter value={1240} formatting={(v) => Math.floor(v).toLocaleString('pt-BR')} /></div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                           <div className="text-gray-400 text-xs font-mono uppercase">Agendamentos</div>
                           <div className="text-2xl font-display font-bold mt-1 text-white"><AnimatedCounter value={84} formatting={(v) => Math.floor(v).toString()} /></div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg border border-brand-orange/20">
                           <div className="text-brand-orange/80 text-xs font-mono uppercase">Atendimentos p/ IA</div>
                           <div className="text-2xl font-display font-bold mt-1 text-brand-orange"><AnimatedCounter value={89} formatting={(v) => Math.floor(v) + "%"} /></div>
                        </div>
                     </div>
                     <div className="h-24 bg-gradient-to-t from-brand-cyan/10 to-transparent rounded-lg border-b-2 border-brand-cyan relative">
                        {/* Fake chart line */}
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <path d="M0,80 Q25,20 50,60 T100,10" fill="none" stroke="#00D9FF" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                        </svg>
                     </div>
                  </div>
                </FadeIn>

                <FadeIn className="order-1 lg:order-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-10">
                     {[
                       "Sistema para salões", "Sistema para clínicas", "Sistema p/ restaurantes", "Agendamentos",
                       "Sistema de delivery", "Sistema financeiro", "Gestão de estoque", "CRM simples", 
                       "Painel administrativo", "Dashboard gerencial"
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan"></div>
                         <span className="text-gray-300 font-mono text-sm">{item}</span>
                       </div>
                     ))}
                  </div>
                  <Button href={WA_LINK}>Quero um sistema personalizado</Button>
                </FadeIn>
             </div>
           </div>
        </section>

        {/* --- CHATBOT & DADOS INFO-CARRIER --- */}
        <section className="py-24 px-6 bg-[#05070D]">
          <div className="max-w-7xl mx-auto space-y-32">
             
             {/* Chatbot feature */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <FadeIn>
                  <Bot size={48} className="text-brand-cyan mb-6" />
                  <h2 className="font-display text-4xl font-semibold mb-6">Atendimento automático <span className="text-brand-cyan">24h</span> no WhatsApp e Instagram</h2>
                  <p className="text-gray-400 text-lg mb-8">Seu cliente não quer esperar. Com chatbot IA, sua empresa responde na hora, qualifica leads, agenda serviços, envia informações e ajuda a vender mesmo fora do horário comercial.</p>
                  <ul className="space-y-4 mb-8">
                     {[
                        "Responde clientes automaticamente 24/7", 
                        "Qualifica interessados e captura dados", 
                        "Agenda consultas ou serviços no seu calendário",
                        "Reduz retrabalho e aumenta velocidade"
                     ].map((b,i) => (
                        <li key={i} className="flex gap-3 text-gray-300">
                           <CheckCircle2 className="text-green-400 shrink-0" size={20} /> {b}
                        </li>
                     ))}
                  </ul>
                  <Button href={WA_LINK} primary={false} className="border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10">Quero automatizar meu atendimento</Button>
                </FadeIn>
                <FadeIn delay={0.2} className="relative">
                   <div className="glass-card rounded-2xl p-6 border-white/5 relative mx-auto max-w-sm">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/5">
                         <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Bot className="text-green-500" size={20} />
                         </div>
                         <div>
                            <div className="font-medium">Assistente de Vendas IA</div>
                            <div className="text-xs text-green-400">Online 24h</div>
                         </div>
                      </div>
                      <div className="space-y-4 text-sm">
                         <div className="bg-white/5 rounded-2xl rounded-tr-sm p-3 max-w-[85%] text-gray-300 border border-white/5">
                            Olá! Qual o valor da consulta e serviços?
                         </div>
                         <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-2xl rounded-tl-sm p-3 max-w-[85%] ml-auto text-brand-white">
                            Olá! 👋 Sou o assistente da clínica. As consultas iniciam em R$150. Gostaria de ver os horários disponíveis para esta semana?
                         </div>
                         <div className="bg-white/5 rounded-2xl rounded-tr-sm p-3 max-w-[85%] text-gray-300 border border-white/5">
                            Sim, quinta à tarde por favor.
                         </div>
                         <div className="bg-brand-cyan/10 border border-brand-cyan/20 rounded-2xl rounded-tl-sm p-3 max-w-[85%] ml-auto text-brand-white flex items-center gap-2">
                            <Check size={16} className="text-brand-cyan" /> Agendamento confirmado!
                         </div>
                      </div>
                   </div>
                </FadeIn>
             </div>

             {/* Dados feature */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <FadeIn delay={0.2} className="order-2 lg:order-1">
                   <div className="grid grid-cols-2 gap-4">
                      {[
                         {t: "Comercial", i: TrendingUp},
                         {t: "Financeiro", i: BarChart3},
                         {t: "Estoque", i: Database},
                         {t: "Produtividade", i: Users}
                      ].map((card, i) => (
                         <div key={i} className="glass-card p-6 rounded-xl flex flex-col items-center justify-center text-center hover:border-brand-orange/50 transition-colors">
                            <card.i size={32} className="text-brand-orange mb-3" />
                            <div className="font-medium text-sm">Dashboard <br/> {card.t}</div>
                         </div>
                      ))}
                   </div>
                </FadeIn>
                <FadeIn className="order-1 lg:order-2">
                  <BarChart3 size={48} className="text-brand-orange mb-6" />
                  <h2 className="font-display text-4xl font-semibold mb-6">Você não pode crescer no <span className="text-brand-orange">escuro</span></h2>
                  <p className="text-gray-400 text-lg mb-6">Com dashboards em Power BI, SQL e Databricks, sua empresa acompanha vendas, lucro, clientes, produtividade e indicadores em tempo real.</p>
                  <div className="pl-4 border-l-2 border-brand-orange mb-8 py-2">
                     <p className="text-xl font-display font-medium italic text-white/90">"Decisão lenta custa dinheiro. Dados claros aceleram crescimento."</p>
                  </div>
                  <Button href={WA_LINK} primary={false} className="border-brand-orange/30 text-brand-orange hover:bg-brand-orange/10">Quero enxergar meus números</Button>
                </FadeIn>
             </div>

          </div>
        </section>

        {/* --- HARDWARE & SUPPORT --- */}
        <section id="suporte" className="py-24 px-6 border-t border-white/5 bg-brand-gray/20">
           <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
             <FadeIn className="max-w-3xl mb-12">
                <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                   <Laptop className="text-gray-300" size={32} />
                </div>
                <h2 className="font-display text-4xl font-semibold mb-6">Computador lento também faz sua empresa perder dinheiro</h2>
                <p className="text-gray-400 text-lg">A Código-Base também cuida da parte física da tecnologia: computadores, notebooks, upgrades, manutenção, redes e suporte técnico de alto nível.</p>
             </FadeIn>
             <FadeIn delay={0.2} className="w-full">
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                   {[
                      "Manutenção de PCs & Notebooks", "Formatação", "Limpeza Interna", 
                      "Remoção de Vírus", "Upgrade de SSD", "Upgrade de RAM", 
                      "Troca de Peças", "Diagnóstico Técnico", "Suporte N2 e N3"
                   ].map((hw, i) => (
                      <span key={i} className="px-4 py-2 rounded-full glass-card text-sm font-mono text-gray-300 border-white/5">
                         {hw}
                      </span>
                   ))}
                </div>
                <Button href={WA_LINK}>Quero suporte técnico</Button>
             </FadeIn>
           </div>
        </section>

        {/* --- PACKAGES --- */}
        <section id="pacotes" className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <FadeIn className="text-center mb-16">
              <h2 className="font-display text-4xl font-semibold mb-4">Planos e Pacotes</h2>
              <p className="text-gray-400">Soluções prontas para alavancar seu digital agora.</p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PACKAGES.map((pkg, idx) => (
                <FadeIn key={idx} delay={idx * 0.1}>
                  <TiltCard className={`glass-card p-8 rounded-2xl h-full flex flex-col relative overflow-hidden ${pkg.isPopular ? 'border-brand-cyan shadow-[0_0_30px_rgba(0,217,255,0.15)] ring-1 ring-brand-cyan/50' : 'border-white/5'}`}>
                    {pkg.isPopular && (
                       <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-cyan to-brand-orange"></div>
                    )}
                    {pkg.isPopular && (
                       <div className="bg-brand-cyan/10 text-brand-cyan text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-full inline-flex self-start border border-brand-cyan/20 mb-4">MAIS VENDIDO</div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{pkg.title}</h3>
                    <div className="text-brand-cyan font-bold font-mono min-h-[40px] mb-6 border-b border-white/10 pb-6 flex items-end">
                       {pkg.price}
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                          <Check size={16} className="text-brand-cyan mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <Button href={WA_LINK} primary={pkg.isPopular} className="w-full text-sm py-3 mt-auto">
                      {pkg.btnText}
                    </Button>
                  </TiltCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* --- DIFFERENCES --- */}
        <section className="py-24 px-6 border-t border-white/5 bg-[#08111F]/30 relative overflow-hidden">
           <div className="max-w-7xl mx-auto">
             <FadeIn className="text-center mb-16">
               <h2 className="font-display text-4xl font-semibold mb-6">Por que escolher a Código-Base?</h2>
               <p className="text-gray-400 font-display text-xl max-w-3xl mx-auto italic">
                 "Você não precisa contratar várias empresas. A Código-Base resolve o digital, os sistemas, os dados e a estrutura técnica."
               </p>
             </FadeIn>
             
             <motion.div 
               variants={staggerContainer}
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-50px" }}
               className="grid grid-cols-2 md:grid-cols-5 gap-4"
             >
                {[
                   "Uma empresa para software & hardware", "Experiência com dados e sistemas",
                   "Soluções personalizadas", "Foco em resultado comercial", "Atendimento direto e humano",
                   "Visual premium e branding", "Automação com IA nativa", "Suporte técnico completo",
                   "Estratégias para negócios locais", "Soluções totalmente escaláveis"
                ].map((dif, i) => (
                   <motion.div variants={staggerItem} key={dif} className="glass-card p-4 rounded-xl text-center border-white/5 flex flex-col items-center justify-center min-h-[120px] hover:bg-white/5">
                      <ShieldCheck size={20} className="text-brand-cyan mb-2 opacity-50" />
                      <span className="text-xs font-mono text-gray-300">{dif}</span>
                   </motion.div>
                ))}
             </motion.div>
           </div>
        </section>

        {/* --- TESTIMONIALS SECTION --- */}
         <section id="depoimentos" className="py-24 px-6 border-t border-white/5 bg-brand-black/40 relative overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 -top-40 w-[600px] h-[400px] bg-brand-orange/5 blur-[160px] rounded-full pointer-events-none"></div>
            <div className="max-w-7xl mx-auto">
               <FadeIn className="text-center mb-16">
                  <div className="text-brand-cyan font-mono text-sm uppercase tracking-wider mb-3">Prova Social</div>
                  <h2 className="font-display text-4xl font-semibold mb-6">O que dizem nossos clientes</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">A opinião de quem confiou na Código-Base para transformar processos físicos e digitais em grandes motores de vendas e organização.</p>
               </FadeIn>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {TESTIMONIALS.map((testimonial, idx) => (
                     <FadeIn key={idx} delay={idx * 0.1}>
                        <div className="glass-card p-8 rounded-2xl border border-white/5 h-full flex flex-col justify-between hover:border-brand-cyan/30 hover:shadow-[0_0_20px_rgba(0,217,255,0.05)] transition-all duration-300">
                           <div>
                              {/* Stars */}
                              <div className="flex gap-1 mb-6">
                                 {Array.from({ length: testimonial.rating }).map((_, i) => (
                                    <Star key={i} size={16} className="fill-brand-orange text-brand-orange" />
                                 ))}
                              </div>
                              {/* Feedback text */}
                              <p className="text-gray-300 italic mb-8 leading-relaxed">"{testimonial.feedback}"</p>
                           </div>
                           
                           {/* User info */}
                           <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                              <div className="w-12 h-12 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center font-display font-bold text-brand-cyan">
                                 {testimonial.avatar}
                              </div>
                              <div>
                                 <div className="font-display text-sm font-semibold text-white">{testimonial.name}</div>
                                 <div className="text-xs text-gray-500 font-mono mt-0.5">{testimonial.role}</div>
                                 <div className="text-xs text-brand-orange font-mono mt-0.5">{testimonial.company}</div>
                              </div>
                           </div>
                        </div>
                     </FadeIn>
                  ))}
               </div>
            </div>
         </section>

         {/* --- CASES DE SUCESSO SECTION --- */}
         <section id="cases-sucesso" className="py-24 px-6 border-t border-white/5 bg-[#030408] relative overflow-hidden">
            <div className="absolute left-1/4 -top-40 w-[400px] h-[400px] bg-brand-cyan/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="max-w-7xl mx-auto">
               <FadeIn className="text-center mb-10">
                  <div className="text-brand-cyan font-mono text-sm uppercase tracking-wider mb-3">Resultados Reais</div>
                  <h2 className="font-display text-4xl font-semibold mb-6">Cases de Sucesso</h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                     Veja como implementamos soluções automatizadas para superar gargalos comerciais e operacionais. Tecnologia moldada para converter e escalar de verdade.
                  </p>
               </FadeIn>

               {/* Sector Filter Tabs */}
               <div className="flex flex-wrap justify-center items-center gap-3 mb-16">
                  {["Todos", "E-commerce", "Saúde", "Jurídico"].map((tab) => (
                     <button
                        key={tab}
                        onClick={() => setActiveCaseTab(tab)}
                        className={`px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-300 border cursor-pointer select-none ${
                           activeCaseTab === tab
                              ? "bg-brand-cyan text-[#030408] border-brand-cyan font-bold shadow-[0_0_20px_rgba(0,217,255,0.35)]"
                              : "bg-[#090d16]/80 text-gray-400 border-white/10 hover:text-white hover:border-brand-cyan/40 hover:bg-white/10"
                        }`}
                     >
                        {tab}
                     </button>
                  ))}
               </div>

               <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[480px]"
               >
                  <AnimatePresence mode="popLayout">
                     {SUCCESS_CASES.filter(
                        (item) => activeCaseTab === "Todos" || item.category === activeCaseTab
                     ).map((item, idx) => (
                        <motion.div 
                           key={item.client}
                           layout
                           initial={{ opacity: 0, scale: 0.9, y: 30 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.9, y: 15 }}
                           whileInView={{ opacity: 1, scale: 1, y: 0 }}
                           viewport={{ once: true, margin: "-80px" }}
                           transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                           className="h-full"
                        >
                           <div className="glass-card p-8 rounded-2xl border border-white/5 h-full flex flex-col justify-between hover:border-brand-cyan/30 hover:shadow-[0_0_25px_rgba(0,217,255,0.08)] transition-all duration-400">
                              <div className="mb-8">
                                 {/* Card Header */}
                                 <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center shrink-0">
                                       {item.icon === "ShoppingBag" && <ShoppingBag size={18} className="text-brand-cyan" />}
                                       {item.icon === "Calendar" && <Calendar size={18} className="text-brand-cyan" />}
                                       {item.icon === "Briefcase" && <Briefcase size={18} className="text-brand-cyan" />}
                                    </div>
                                    <div className="min-w-0">
                                       <h3 className="font-display font-semibold text-base text-white leading-none truncate">{item.client}</h3>
                                       <span className="text-xs font-mono text-gray-300 font-bold block mt-1">{item.industry}</span>
                                    </div>
                                 </div>

                                 <p className="text-gray-300 text-sm leading-relaxed mb-6">{item.description}</p>
                              </div>

                              {/* Before and After Mini-graph panel */}
                              <div className="space-y-4 pt-6 mt-auto border-t border-white/10">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xs font-mono text-brand-cyan font-bold uppercase tracking-wider">Métricas comparativas</span>
                                    <span className="text-[10px] font-mono text-gray-200 bg-white/10 px-2 py-0.5 rounded border border-white/15 uppercase font-bold">Antes vs Depois</span>
                                 </div>

                                 <div className="space-y-3.5">
                                    {item.metrics.map((metric, mIdx) => {
                                       const isReduction = ["cost", "hours", "time"].includes(metric.type);
                                       
                                       const beforeWidth = isReduction ? "85%" : "35%";
                                       const afterWidth = isReduction ? "25%" : "90%";
                                       
                                       const beforeColor = isReduction ? "bg-red-500/80" : "bg-gray-600";
                                       const afterColor = "bg-gradient-to-r from-brand-cyan to-cyan-400";
                                       
                                       return (
                                          <div key={mIdx} className="bg-brand-black/65 p-3.5 rounded-xl border border-white/10 space-y-2 text-xs">
                                             <div className="flex justify-between items-center text-xs">
                                                {/* Metric Label with Tooltip Trigger */}
                                                <div className="relative group/tooltip flex items-center gap-1.5 cursor-help">
                                                   <span className="text-slate-50 font-sans font-semibold border-b border-dashed border-gray-400 hover:text-brand-cyan hover:border-brand-cyan/80 transition-colors duration-200">
                                                      {metric.label}
                                                   </span>
                                                   <Info size={11} className="text-gray-400 group-hover/tooltip:text-brand-cyan transition-colors duration-200 shrink-0" />
                                                   
                                                   {/* Tooltip Content */}
                                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3.5 bg-[#121c33] border border-brand-cyan/35 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.8)] opacity-0 scale-90 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-200 z-50 text-xs text-white leading-normal font-sans text-center">
                                                      {metric.tooltip}
                                                      {/* Tooltip Arrow */}
                                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#121c33]" />
                                                   </div>
                                                </div>

                                                <span className="text-[10px] font-mono font-extrabold text-[#FFA74F] bg-brand-orange/20 px-2 py-0.5 rounded border border-brand-orange/30">
                                                   {metric.change}
                                                </span>
                                             </div>

                                             <div className="space-y-2 text-[11px] font-mono">
                                                {/* Antes Row */}
                                                <div className="flex items-center gap-2">
                                                   <span className="w-10 text-gray-300 font-bold uppercase text-[9px] text-right">Antes</span>
                                                   <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                      <div className={`h-full rounded-full ${beforeColor}`} style={{ width: beforeWidth }} />
                                                   </div>
                                                   <span className="w-14 text-right text-gray-200 font-bold">{metric.before}</span>
                                                </div>

                                                {/* Depois Row */}
                                                <div className="flex items-center gap-2">
                                                   <span className="w-10 text-brand-cyan font-extrabold uppercase text-[9px] text-right">Depois</span>
                                                   <div className="flex-1 h-2 bg-brand-cyan/20 rounded-full overflow-hidden">
                                                      <motion.div 
                                                         initial={{ width: 0 }}
                                                         whileInView={{ width: afterWidth }}
                                                         viewport={{ once: true }}
                                                         transition={{ duration: 1, ease: "easeOut", delay: mIdx * 0.15 }}
                                                         className={`h-full rounded-full ${afterColor} shadow-[0_0_12px_rgba(0,217,255,0.6)]`} 
                                                      />
                                                   </div>
                                                   <span className="w-14 text-right text-brand-cyan font-extrabold">{metric.after}</span>
                                                </div>
                                             </div>
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </AnimatePresence>
               </motion.div>
            </div>
         </section>

         {/* --- SIMULADOR DE CRESCIMENTO E DIAGNÓSTICO DE TI (PREMIUM INTERACTIVE TOOL) --- */}
         <section id="simulador" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-[#030408] to-[#060B14] relative overflow-hidden">
            {/* Tech Decorative Lines/Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d9ff02_1px,transparent_1px),linear-gradient(to_bottom,#00d9ff02_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute left-1/2 -top-40 w-[600px] h-[400px] bg-brand-cyan/5 blur-[160px] rounded-full pointer-events-none"></div>
            <div className="absolute right-0 bottom-0 w-[500px] h-[300px] bg-brand-orange/5 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
               <FadeIn className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-mono uppercase tracking-widest mb-4">
                     <Zap size={12} className="animate-pulse" />
                     <span>Simulador Interativo</span>
                  </div>
                  <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6">Mapeie Sua <span className="text-brand-cyan">Maturidade Digital</span></h2>
                  <p className="text-gray-400 text-lg max-w-3xl mx-auto font-sans leading-relaxed">
                     Tome decisões baseadas em números reais. Monte seu escopo ideal para ver estimativas personalizadas de economia ou realize um diagnóstico rápido da TI e Marketing do seu negócio.
                  </p>
               </FadeIn>

               {/* Tab Selector Hub - Carbon Panel */}
               <div className="flex justify-center mb-12">
                  <div className="bg-brand-black/80 border border-white/10 p-1.5 rounded-2xl flex gap-2 shadow-2xl relative">
                     <button
                        onClick={() => setSimTab("calculator")}
                        className={`px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                           simTab === "calculator"
                              ? "bg-gradient-to-r from-brand-cyan to-cyan-500 text-brand-black shadow-[0_0_20px_rgba(0,217,255,0.3)] font-extrabold"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                     >
                        <BarChart3 size={14} />
                        <span>Calculadora de ROI & Escopo</span>
                     </button>

                     <button
                        onClick={() => setSimTab("quiz")}
                        className={`px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                           simTab === "quiz"
                              ? "bg-gradient-to-r from-brand-cyan to-cyan-500 text-brand-black shadow-[0_0_20px_rgba(0,217,255,0.3)] font-extrabold"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                        }`}
                     >
                        <ShieldCheck size={14} />
                        <span>Diagnóstico de TI & Marketing</span>
                     </button>
                  </div>
               </div>

               {/* Sub-Panels with AnimatePresence */}
               <AnimatePresence mode="wait">
                  {simTab === "calculator" ? (
                     <motion.div
                        key="calc"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                     >
                        {/* LEFT COLUMN: Controls & Selections (Col 7) */}
                        <div className="lg:col-span-7 space-y-8">
                           <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                              <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                                 <span className="text-brand-cyan font-mono text-sm uppercase bg-brand-cyan/10 px-2 py-0.5 rounded">1</span>
                                 Selecione as Soluções que Deseja Integrar
                              </h3>

                              <div className="space-y-4">
                                 {SIMULATOR_SERVICES.map((srv) => {
                                    const isSelected = simSelectedServices[srv.id];
                                    const IconComp = srv.icon;
                                    return (
                                       <div
                                          key={srv.id}
                                          onClick={() => setSimSelectedServices({
                                             ...simSelectedServices,
                                             [srv.id]: !isSelected
                                          })}
                                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-4 select-none relative overflow-hidden group/srv ${
                                             isSelected
                                                ? "bg-brand-cyan/5 border-brand-cyan shadow-[0_0_15px_rgba(0,217,255,0.06)]"
                                                : "bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10"
                                          }`}
                                       >
                                          <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${isSelected ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-white/5 text-gray-400 group-hover/srv:text-white'}`}>
                                             <IconComp size={20} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-semibold text-sm text-white block truncate">{srv.title}</span>
                                                <span className="text-[10px] font-mono font-bold text-gray-500 group-hover/srv:text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                   {srv.price === 1800 ? "SaaS Nível 1" : srv.price === 850 ? "IA Atendimento" : srv.price === 600 ? "BI Dash" : "Suporte Técnico"}
                                                </span>
                                             </div>
                                             <p className="text-xs text-gray-400 leading-relaxed max-w-xl">{srv.desc}</p>
                                             <span className="text-[10px] text-brand-cyan font-mono mt-1.5 block opacity-85 leading-none">
                                                📍 {srv.metrics}
                                             </span>
                                          </div>
                                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-1 transition-colors ${isSelected ? 'bg-brand-cyan border-brand-cyan text-brand-black' : 'border-gray-500'}`}>
                                             {isSelected && <Check size={14} className="stroke-[3]" />}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>

                           {/* Sliders Area */}
                           <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
                              <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                                 <span className="text-brand-cyan font-mono text-sm uppercase bg-brand-cyan/10 px-2 py-0.5 rounded">2</span>
                                 Metadados & Desempenho da sua Operação Atual
                              </h3>

                              <div className="space-y-6">
                                 {/* Slider 1 */}
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                       <span className="text-gray-300 font-sans font-medium">Contatos Comerciais (leads salvos por mês):</span>
                                       <span className="text-brand-cyan font-mono font-bold text-sm bg-brand-cyan/10 border border-brand-cyan/20 px-2.5 py-0.5 rounded-lg">
                                          {simLeadsPerMonth} leads
                                       </span>
                                    </div>
                                    <input
                                       type="range"
                                       min="10"
                                       max="1000"
                                       step="10"
                                       value={simLeadsPerMonth}
                                       onChange={(e) => setSimLeadsPerMonth(Number(e.target.value))}
                                       className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-cyan animate-pulse"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                       <span>10 leads</span>
                                       <span>500</span>
                                       <span>1000+ leads</span>
                                    </div>
                                 </div>

                                 {/* Slider 2 */}
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                       <span className="text-gray-300 font-sans font-medium">Tempo desperdiçado em planilhas & retrabalhos manuais:</span>
                                       <span className="text-brand-orange font-mono font-bold text-sm bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-0.5 rounded-lg">
                                          {simWastedHours}h /semana
                                       </span>
                                    </div>
                                    <input
                                       type="range"
                                       min="2"
                                       max="60"
                                       step="1"
                                       value={simWastedHours}
                                       onChange={(e) => setSimWastedHours(Number(e.target.value))}
                                       className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                       <span>2 horas</span>
                                       <span>30 horas</span>
                                       <span>60+ horas /sem</span>
                                    </div>
                                 </div>

                                 {/* Slider 3 */}
                                 <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                       <span className="text-gray-300 font-sans font-medium">Demora média para responder um lead no WhatsApp:</span>
                                       <span className="text-red-400 font-mono font-bold text-sm bg-red-400/10 border border-red-400/20 px-2.5 py-0.5 rounded-lg">
                                          {simResponseDelay} minutos
                                       </span>
                                    </div>
                                    <input
                                       type="range"
                                       min="2"
                                       max="180"
                                       step="2"
                                       value={simResponseDelay}
                                       onChange={(e) => setSimResponseDelay(Number(e.target.value))}
                                       className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                       <span>Imediato (1 min)</span>
                                       <span>90 min</span>
                                       <span>3h+ (180 min)</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* RIGHT COLUMN: Output Live Dashboard (Col 5) */}
                        <div className="lg:col-span-12 xl:col-span-5">
                           {(() => {
                              const selectedItems = SIMULATOR_SERVICES.filter(s => simSelectedServices[s.id]);
                              const selectedCount = selectedItems.length;

                              if (selectedCount === 0) {
                                 return (
                                    <div className="glass-panel border border-dashed border-white/10 p-8 rounded-3xl h-[480px] flex flex-col items-center justify-center text-center space-y-4">
                                       <div className="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan/25 flex items-center justify-center text-brand-cyan text-xl font-bold animate-pulse">
                                          ?
                                       </div>
                                       <h3 className="text-xl font-display font-semibold text-white">Nenhum Serviço Selecionado</h3>
                                       <p className="text-sm text-gray-400 max-w-sm">
                                          Para ver a projeção de economia corporativa e ROI automatizado em tempo real, marque um ou mais serviços do painel ao lado.
                                       </p>
                                       <span className="text-xs text-brand-orange font-mono">✦ Recomenda-se começar marcando Sistemas e Chatbots.</span>
                                    </div>
                                 );
                              }

                              // Calculate Cost
                              const basePrice = selectedItems.reduce((sum, s) => sum + s.price, 0);
                              const discountActive = selectedCount >= 3;
                              const discountVal = discountActive ? 0.12 : 0;
                              const finalPriceEst = Math.round(basePrice * (1 - discountVal));

                              // Calculate recovered hours per month (weekly hours saved * 4.3 + slider inputs benefits)
                              const hourlyGainWeekly = selectedItems.reduce((sum, s) => sum + s.hoursSaved, 0);
                              const saasWastedBenefit = simSelectedServices.saas ? (simWastedHours * 0.75) : 0;
                              const botDelBenefit = simSelectedServices.bot ? (simLeadsPerMonth * (simResponseDelay / 40) * 0.05 / 4.3) : 0;
                              
                              const totalHoursSavedMonthly = Math.round((hourlyGainWeekly + saasWastedBenefit + botDelBenefit) * 4.3);

                              // Calculate financial benefit (ROI value):
                              // 1. Recovered spreadsheet waste cost (valued at R$ 42/hour)
                              const recoveredPayrollValue = totalHoursSavedMonthly * 42;
                              // 2. Conversion rate boost:
                              const totalConvBoostPct = selectedItems.reduce((sum, s) => sum + s.conversionBoost, 0);
                              // Suppose standard conversion is 5%, tickets are R$ 380 average. Real leads convert to cash:
                              const estimatedRevenueBoost = Math.round(
                                 simLeadsPerMonth * (totalConvBoostPct / 100) * 0.06 * 380
                              );
                              const totalFinancialBoost = Math.round(recoveredPayrollValue + estimatedRevenueBoost);
                              const roiFactor = (totalFinancialBoost / (finalPriceEst || 300)).toFixed(1);

                              const handleGeneratorWhatsAppText = () => {
                                 const servicesCSV = selectedItems.map(s => s.title).join(", ");
                                 const waMsg = `Olá Código-Base! Realizei a simulação do escopo técnico para o meu negócio:
                                 
⚙️ *Serviços que selecionei:* ${servicesCSV}
📈 *Dados Operacionais atuais:*
- Leads por mês: ${simLeadsPerMonth}
- Horas manuais desperdiçadas: ${simWastedHours}h por semana
- Atraso de retorno no WhatsApp: ${simResponseDelay} minutos

📊 *Estimativas projetadas em tempo real:*
- Horas de operação recuperadas: ~${totalHoursSavedMonthly}h por mês
- Retorno Estimado Provisório: R$ ${(totalFinancialBoost * 0.85).toFixed(0)} a R$ ${(totalFinancialBoost * 1.15).toFixed(0)} por mês

Gostaria de agendar uma reunião comercial de 15 minutos para validar esta proposta personalizada!`;
                                 return `${WA_LINK}&text=${encodeURIComponent(waMsg)}`;
                              };

                              return (
                                 <div className="bg-brand-black border border-brand-cyan/25 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,217,255,0.12)] space-y-6 relative overflow-hidden h-full">
                                    {/* Subtle pulsing scanner visual top */}
                                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent animate-pulse" />

                                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                       <h4 className="font-display font-bold text-sm tracking-widest text-[#00D9FF] font-mono uppercase">Indicador Automatizado de ROI</h4>
                                       <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded border border-white/10 uppercase">PROJEÇÃO ATIVA</span>
                                    </div>

                                    {/* Item 1: Price Estimate */}
                                    <div className="space-y-1.5">
                                       <span className="text-gray-400 text-xs">Investimento Estimado Provisório:</span>
                                       <div className="flex items-baseline gap-2">
                                          <span className="text-3xl font-display font-extrabold text-white">
                                             {simSelectedServices.saas ? `A partir de R$ ${finalPriceEst}` : `R$ ${finalPriceEst}`}
                                          </span>
                                          <span className="text-xs text-gray-500 font-mono">/ao mês</span>
                                       </div>
                                       {discountActive && (
                                          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1">
                                             <CheckCircle2 size={10} />
                                             <span>Desconto Multipacote de 12% aplicado!</span>
                                          </div>
                                       )}
                                       {simSelectedServices.saas && (
                                          <p className="text-[10px] text-brand-orange font-mono">📍 Como o pacote envolve Sistema SaaS, o valor definitivo variará conforme regras de negócio.</p>
                                       )}
                                    </div>

                                    {/* Row Meters */}
                                    <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-5">
                                       <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                                          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Horas Recuperadas:</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-2xl font-mono font-extrabold text-brand-cyan">~{totalHoursSavedMonthly}h</span>
                                             <span className="text-[10px] text-gray-500 font-sans">/mês</span>
                                          </div>
                                          <span className="text-[9px] text-[#00D9FF] font-mono mt-1 block">Recuperação produtiva</span>
                                       </div>

                                       <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                                          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Taxa de Conversão:</span>
                                          <div className="flex items-baseline gap-1">
                                             <span className="text-2xl font-mono font-extrabold text-emerald-400">+{totalConvBoostPct}%</span>
                                          </div>
                                          <span className="text-[9px] text-emerald-400 font-mono mt-1 block">Aceleração de leads</span>
                                       </div>
                                    </div>

                                    {/* Impact Statement / ROI Analysis */}
                                    <div className="bg-brand-cyan/5 border border-brand-cyan/20 p-4 rounded-2xl space-y-2">
                                       <div className="flex justify-between items-center text-xs">
                                          <span className="text-gray-300 font-sans font-medium">Retorno Estimado Total:</span>
                                          <span className="text-brand-cyan font-mono font-extrabold bg-brand-cyan/15 px-2 py-0.5 rounded border border-brand-cyan/20 text-[10px]">
                                             {roiFactor}x ROI Estimado
                                          </span>
                                       </div>
                                       <div className="text-lg font-mono font-bold text-[#FFA74F]">
                                          R$ {(totalFinancialBoost * 0.85).toFixed(0)} - R$ {(totalFinancialBoost * 1.15).toFixed(0)} <span className="text-xs text-gray-400 font-sans font-normal">/por mês</span>
                                       </div>
                                       <p className="text-[10.5px] text-gray-400 leading-normal">
                                          Soma da economia por automação de horas manuais de backoffice (~R$ {Math.round(recoveredPayrollValue)}) mais a conversão inteligente de novos clientes que hoje se perdem devido à demora média atual de {simResponseDelay} minutos.
                                       </p>
                                    </div>

                                    {/* CTA Button */}
                                    <div className="pt-2">
                                       <Button
                                          href={handleGeneratorWhatsAppText()}
                                          className="w-full justify-center !py-4 shadow-xl active:scale-95 transition-all text-sm uppercase tracking-wide flex items-center font-bold"
                                       >
                                          <MessageCircle size={18} className="stroke-[2.5] text-brand-black animate-pulse" />
                                          <span>Solicitar Orçamento do Escopo</span>
                                       </Button>
                                       <span className="text-[10px] text-center text-gray-500 font-mono mt-3.5 block">
                                          ⚡ Proposta gerada de forma instantânea baseada nos seus dados de entrada.
                                       </span>
                                    </div>
                                 </div>
                              );
                           })()}
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div
                        key="quiz"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="max-w-3xl mx-auto"
                     >
                        {!showQuizResult ? (
                           <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/5 space-y-8 shadow-2xl relative">
                              {/* Quiz Header & Page indicators */}
                              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                                 <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse" />
                                    <span className="text-xs font-mono font-bold text-brand-cyan uppercase tracking-wider">TI & Marketing Health Scan</span>
                                 </div>
                                 <span className="text-xs font-mono text-gray-400">
                                    Questão <strong className="text-white">{quizStep + 1}</strong> de {QUIZ_QUESTIONS.length}
                                 </span>
                              </div>

                              {/* Question Text */}
                              <div className="space-y-2">
                                 <h3 className="text-xl md:text-2xl font-display font-semibold text-white leading-tight">
                                    {QUIZ_QUESTIONS[quizStep].question}
                                 </h3>
                                 <p className="text-xs text-gray-400 font-sans">Selecione a alternativa que melhor descreve o cenário real do seu negócio:</p>
                              </div>

                              {/* Options vertical pile */}
                              <div className="space-y-3.5">
                                 {QUIZ_QUESTIONS[quizStep].options.map((opt, oIdx) => {
                                    const optionLetter = ["A", "B", "C", "D"][oIdx];
                                    return (
                                       <button
                                          key={oIdx}
                                          onClick={() => {
                                             const newAnswers = [...quizAnswers];
                                             newAnswers[quizStep] = oIdx;
                                             setQuizAnswers(newAnswers);

                                             if (quizStep < QUIZ_QUESTIONS.length - 1) {
                                                setQuizStep(quizStep + 1);
                                             } else {
                                                setShowQuizResult(true);
                                             }
                                             trackConversion("quiz_option_click", { question: quizStep, optionSelected: oIdx });
                                          }}
                                          className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-cyan/40 hover:bg-white/10 transition-all duration-300 text-left cursor-pointer flex items-center gap-4 group/opt focus:outline-none"
                                       >
                                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-gray-400 group-hover/opt:border-brand-cyan/40 group-hover/opt:text-brand-cyan group-hover/opt:bg-brand-cyan/10 transition-colors shrink-0">
                                             {optionLetter}
                                          </div>
                                          <span className="text-sm text-gray-300 font-sans leading-relaxed group-hover/opt:text-white transition-colors">
                                             {opt.text}
                                          </span>
                                       </button>
                                    );
                                 })}
                              </div>

                              {/* Progress Bar indicator bottom */}
                              <div className="pt-4 space-y-2">
                                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                       className="h-full bg-gradient-to-r from-brand-cyan to-cyan-400 transition-all duration-300"
                                       style={{ width: `${((quizStep) / QUIZ_QUESTIONS.length) * 100}%` }}
                                    />
                                 </div>
                              </div>
                           </div>
                        ) : (
                           // QUIZ RESULTS CONTAINER
                           (() => {
                              // Compute Score
                              const sumPts = quizAnswers.reduce((sum, ansIdx, qIdx) => {
                                 return sum + QUIZ_QUESTIONS[qIdx].options[ansIdx].pts;
                              }, 0);
                              const avgScore = Math.round(sumPts / QUIZ_QUESTIONS.length);

                              // Classify
                              let title = "";
                              let colorClass = "";
                              let gradeLabel = "";
                              let desc = "";
                              let recommendations: string[] = [];

                              if (avgScore >= 90) {
                                 title = "💎 Nível Prime Digital";
                                 colorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
                                 gradeLabel = "Grau A+";
                                 desc = "Excelente! Sua maturidade tecnológica é fantástica. Sua empresa tem ótimos controles e segurança, mas sempre há margem para automatizar integrações personalizadas.";
                                 recommendations = [
                                    "Consolidação de fluxos de Big Data / Automações de APIs profundas adicionais",
                                    "Configuração de Inteligência de BI preditiva baseada em Machine Learning",
                                    "Auditoria anual de vulnerabilidade do firewall e roteamento avançado"
                                 ];
                              } else if (avgScore >= 66) {
                                 title = "🟢 Nível Tecnológico Moderado";
                                 colorClass = "text-brand-cyan border-brand-cyan/20 bg-brand-cyan/5";
                                 gradeLabel = "Grau B";
                                 desc = "Ótimos pilares! Sua operação roda bem, mas faltam automações cruciais com robôs de Inteligência Artificial e unhas de dados operacionais que poderiam acelerar suas vendas.";
                                 recommendations = [
                                    "Substituir o menu básico ou humano do WhatsApp por IA nativa conversacional 24h",
                                    "Implementar calendários de marketing constantes e automatizados no Instagram",
                                    "Conectar banco de dados direto ao Power BI eliminando preenchimentos semanais"
                                 ];
                              } else if (avgScore >= 40) {
                                 title = "🟡 Nível Vulnerável e Analógico";
                                 colorClass = "text-brand-orange border-brand-orange/20 bg-brand-orange/5";
                                 gradeLabel = "Grau C";
                                 desc = "Sua empresa funciona, mas está travando nos controles diários. O gasto de tempo manual em planilhas e a lentidão no WhatsApp impedem sua escala de mercado.";
                                 recommendations = [
                                    "Instalação urgente de chatbot IA para captação de leads fora do horário comercial",
                                    "Criação de um sistema web interno customizado (SaaS) para parar de usar planilhas instáveis",
                                    "Análise de upgrade de RAM e SSD nas máquinas lentas do escritório"
                                 ];
                              } else {
                                 title = "🔴 Nível Crítico Operacional";
                                 colorClass = "text-red-400 border-red-500/20 bg-red-500/5";
                                 gradeLabel = "Grau F";
                                 desc = "Atenção Crítica! Sua empresa está vulnerável a lentidões, incidentes de perda de dados e faturamento devido a processos manuais excessivos e falta de segurança técnica básica.";
                                 recommendations = [
                                    "Formatação básica geral de computadores obsoletos e firewall básico de rede corporativa",
                                    "Triagem urgente no WhatsApp Comercial com IA para não dar vácuo em novos leads",
                                    "Mapeamento básico de faturamento em um único banco de dados, parando com o achismo"
                                 ];
                              }

                              const handleQuizWA = () => {
                                 const text = `Olá, Código-Base! Concluí o Diagnóstico Express de TI & Marketing no site e gostaria de falar sobre as recomendações.

🎯 *Resultado Geral:* Pontuação ${avgScore}/100 [${title} - ${gradeLabel}]

*Recomendações Geradas:*
${recommendations.map(r => `• ${r}`).join("\n")}

Gostaria de agendar meu diagnóstico gratuito de TI e computadores para entender as soluções ideais para minha empresa!`;
                                 window.open(`${WA_LINK}&text=${encodeURIComponent(text)}`, "_blank");
                              };

                              const resetQuizState = () => {
                                 setQuizAnswers([]);
                                 setQuizStep(0);
                                 setShowQuizResult(false);
                              };

                              return (
                                 <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="glass-card rounded-3xl p-6 md:p-10 border border-white/5 space-y-8 shadow-2xl relative font-sans"
                                 >
                                    <div className="text-center space-y-4 pb-6 border-b border-white/5">
                                       <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Resultado Final do Scan</span>
                                       <div className="flex justify-center items-center gap-3">
                                          <div className="text-5xl font-mono font-extrabold text-white">{avgScore}%</div>
                                          <span className={`text-xs uppercase px-3 py-1 border rounded-lg font-mono font-bold ${colorClass}`}>
                                             {gradeLabel}
                                          </span>
                                       </div>
                                       <h3 className="text-2xl font-display font-bold text-white tracking-tight">{title}</h3>
                                       <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto">{desc}</p>
                                    </div>

                                    {/* Recommendations Cards */}
                                    <div className="space-y-4">
                                       <h4 className="font-mono text-xs font-bold text-[#00D9FF] uppercase tracking-wider">Passos Recomendados para sua Empresa:</h4>
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {recommendations.map((rec, rIdx) => (
                                             <div key={rIdx} className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col justify-between hover:border-brand-cyan/25 transition-colors">
                                                <div className="space-y-2">
                                                   <span className="w-6 h-6 rounded-md bg-brand-cyan/15 text-brand-cyan font-mono text-xs font-bold flex items-center justify-center">
                                                      {rIdx + 1}
                                                   </span>
                                                   <p className="text-xs text-gray-300 font-sans leading-relaxed">{rec}</p>
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 border-t border-white/5">
                                       <button
                                          onClick={handleQuizWA}
                                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-cyan hover:bg-[#00c2eB] text-brand-black shadow-[0_0_20px_rgba(0,217,255,0.4)] font-bold text-sm rounded-xl cursor-pointer select-none border-none transition-all duration-200"
                                       >
                                          <MessageCircle size={18} />
                                          <span>Agendar TI Scan & Consultoria Gratuita</span>
                                       </button>
                                       <button
                                          onClick={resetQuizState}
                                          className="w-full sm:w-auto text-xs font-mono font-bold text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 px-5 py-3.5 rounded-xl cursor-pointer transition-all active:scale-95"
                                       >
                                          Refazer Diagnóstico
                                       </button>
                                    </div>
                                 </motion.div>
                              );
                           })()
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </section>

         {/* --- STORYTELLING --- */}
        <section className="py-32 px-6 bg-brand-cyan/5 border-y border-brand-cyan/10">
           <div className="max-w-3xl mx-auto text-center">
              <FadeIn>
                 <h2 className="font-display text-4xl font-bold mb-8 leading-tight">Enquanto você cuida do negócio, <br/>sua tecnologia <span className="text-brand-cyan">trabalha por você</span></h2>
                 <p className="text-xl text-gray-400 leading-relaxed font-light mb-10">
                    Imagine seu Instagram postando com constância, seu WhatsApp respondendo clientes automaticamente, seus sistemas organizando pedidos e seus dashboards mostrando os números em tempo real. Esse é o tipo de estrutura que a Código-Base cria para empresas que querem parar de improvisar e começar a crescer com inteligência.
                 </p>
                 <Button href={WA_LINK}>Quero essa estrutura no meu negócio</Button>
              </FadeIn>
           </div>
        </section>

         {/* --- FAQ --- */}
         <section className="py-24 px-6 bg-[#05070D]" id="faq">
           <div className="max-w-3xl mx-auto">
             <FadeIn className="text-center mb-10">
               <h2 className="font-display text-4xl font-semibold mb-4">Dúvidas Frequentes</h2>
               <p className="text-sm text-gray-400 font-sans max-w-lg mx-auto">
                 Dúvidas sobre nossos pacotes, processos ou suporte? Pesquise abaixo por termos-chave.
               </p>
             </FadeIn>

             {/* Search Input Box */}
             <FadeIn className="mb-8" delay={0.1}>
               <div className="relative max-w-lg mx-auto">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                   <Search size={18} className="text-brand-cyan/80" />
                 </div>
                 <input
                   type="text"
                   placeholder="Buscar dúvidas (ex: prazo, suporte, IA...)"
                   value={faqSearch}
                   onChange={(e) => setFaqSearch(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 hover:border-brand-cyan/40 focus:border-brand-cyan text-sm py-3 pl-11 pr-10 rounded-2xl text-white placeholder-gray-500 focus:outline-none transition-all duration-300 font-mono focus:ring-1 focus:ring-brand-cyan/20"
                 />
                 {faqSearch && (
                   <button
                     onClick={() => setFaqSearch("")}
                     className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                     title="Limpar pesquisa"
                   >
                     <X size={16} />
                   </button>
                 )}
               </div>
             </FadeIn>

             {/* Dynamic Filter Results */}
             <div className="space-y-4">
               {(() => {
                 const filtered = FAQS.filter(
                   (faq) =>
                     faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                     faq.a.toLowerCase().includes(faqSearch.toLowerCase())
                 );

                 if (filtered.length === 0) {
                   return (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="text-center py-12 px-6 glass-card rounded-2xl border border-dashed border-white/5"
                     >
                       <p className="text-gray-400 text-sm font-sans mb-3">
                         Nenhuma dúvida encontrada para <span className="text-brand-orange font-bold font-mono">"{faqSearch}"</span>.
                       </p>
                       <p className="text-xs text-gray-500 mb-6 font-mono">
                         Tente buscar por termos mais genéricos ou chame nossa equipe diretamente.
                       </p>
                       <a
                         href={WA_LINK}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-2 text-xs font-mono font-bold text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20 px-4 py-2.5 rounded-lg border border-brand-cyan/20 transition-all cursor-pointer"
                       >
                         <MessageCircle size={14} />
                         <span>Chamar no WhatsApp</span>
                       </a>
                     </motion.div>
                   );
                 }

                 return filtered.map((faq, idx) => (
                   <FadeIn key={faq.q} delay={idx * 0.05}>
                      <details className="group glass-card rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden border border-white/5 hover:border-brand-cyan/10 transition-colors">
                         <summary className="flex cursor-pointer items-center justify-between p-6 font-medium text-white transition-colors hover:bg-white/5 font-sans">
                            <span className="pr-4">{faq.q}</span>
                            <span className="transition duration-300 group-open:-rotate-180 text-brand-cyan shrink-0">
                               <ChevronDown size={20} />
                            </span>
                         </summary>
                         <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4 font-sans">
                            {faq.a}
                         </div>
                      </details>
                   </FadeIn>
                 ));
               })()}
             </div>
           </div>
         </section>

        {/* --- FINAL CTA --- */}
        <section className="py-32 px-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-brand-cyan/5"></div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-brand-cyan/20 blur-[150px] rounded-full pointer-events-none"></div>
           
           <div className="max-w-4xl mx-auto relative z-10 text-center glass-card border border-brand-cyan/20 rounded-3xl p-10 md:p-16 shadow-[0_0_50px_rgba(0,217,255,0.1)]">
              <Terminal size={48} className="text-brand-cyan mx-auto mb-6" />
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Pronto para transformar sua empresa com tecnologia?</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
                 Fale agora com a Código-Base e descubra qual solução faz mais sentido para o seu negócio crescer de forma inteligente e escalável.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                 <Button href={WA_LINK} className="w-full sm:w-auto !px-8">Falar no WhatsApp</Button>
                 <Button href="#pacotes" primary={false} className="w-full sm:w-auto">Ver pacotes</Button>
                 <Button href={WA_LINK} primary={false} className="w-full sm:w-auto border-transparent hover:border-transparent hover:bg-white/5 underline underline-offset-4 decoration-white/30 text-gray-400">Solicitar orçamento</Button>
                 <button
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-mono font-bold text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20 px-5 py-3.5 rounded-xl border border-brand-cyan/20 transition-all cursor-pointer hover:border-brand-cyan/40 hover:scale-105 active:scale-95 print:hidden"
                    title="Copiar Link da Página"
                 >
                    <Copy size={16} />
                    <span>Copiar Link</span>
                 </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-white/10 text-sm">
                 <div>
                    <span className="block text-gray-500 font-mono mb-1 text-xs uppercase">WhatsApp</span>
                    <a href={WA_LINK} className="text-white hover:text-brand-cyan transition-colors">(11) 98626-2240</a>
                 </div>
                 <div>
                    <span className="block text-gray-500 font-mono mb-1 text-xs uppercase">Instagram</span>
                    <a href="https://instagram.com/codigo.base" target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand-cyan transition-colors">@codigo.base</a>
                 </div>
                 <div>
                    <span className="block text-gray-500 font-mono mb-1 text-xs uppercase">Site</span>
                    <span className="text-white">www.codigobase.com.br</span>
                 </div>
                 <div>
                    <span className="block text-gray-500 font-mono mb-1 text-xs uppercase">E-mail</span>
                    <a href="mailto:Projetosti.jgs@gmail.com" className="text-white hover:text-brand-cyan transition-colors truncate block">Projetosti.jgs@gmail.com</a>
                 </div>
              </div>
           </div>
        </section>

         {/* --- EMAIL CAPTURE SECTION --- */}
         <section id="guia-gratuito" className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-[#05070D] to-[#010204] border-t border-white/5">
            <div className="absolute right-1/4 bottom-0 w-[400px] h-[400px] bg-brand-cyan/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="max-w-4xl mx-auto">
               <div className="glass-card p-8 md:p-12 rounded-3xl border border-brand-cyan/10 relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-cyan/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                     <div className="lg:col-span-6 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 rounded-full border border-brand-cyan/20">
                           <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
                           <span className="text-xs font-mono text-brand-cyan font-bold uppercase tracking-wider">Material Exclusivo</span>
                        </div>
                        <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                           Guia Gratuito: <br/>
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-orange">IA para Pequenos Negócios</span>
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                           Descubra as ferramentas práticas, prompts e automações que você pode implementar hoje mesmo para economizar tempo e fechar mais vendas sem investir fortunas.
                        </p>
                     </div>

                     <div className="lg:col-span-6 bg-brand-black/40 p-6 md:p-8 rounded-2xl border border-white/5 relative z-10">
                        {isFormSubmitted ? (
                           <div className="text-center py-6 space-y-4">
                              <div className="w-16 h-16 bg-brand-cyan/15 border border-brand-cyan/20 rounded-full flex items-center justify-center mx-auto text-brand-cyan">
                                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                 </svg>
                              </div>
                              <h3 className="font-display text-xl font-bold text-white">Guia enviado com sucesso!</h3>
                              <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                                 Obrigado, <strong className="text-[#00d9ff]">{leadName}</strong>. Enviamos o Guia Completo para <strong className="text-white">{leadEmail}</strong>. Verifique sua caixa de entrada e spam.
                              </p>
                           </div>
                        ) : (
                           <form onSubmit={handleFormSubmit} className="space-y-4">
                              <div>
                                 <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Seu Nome completo</label>
                                 <input
                                    type="text"
                                    required
                                    placeholder="Ex: Rafael Souza"
                                    value={leadName}
                                    onChange={(e) => setLeadName(e.target.value)}
                                    className="w-full bg-white/5 py-2.5 px-4 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-brand-cyan transition-colors font-mono"
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Seu melhor E-mail</label>
                                 <input
                                    type="text"
                                    required
                                    placeholder="Ex: rafael@seuemail.com"
                                    value={leadEmail}
                                    onChange={(e) => {
                                       setLeadEmail(e.target.value);
                                       if (leadEmailError) setLeadEmailError("");
                                    }}
                                    className={`w-full bg-white/5 py-2.5 px-4 rounded-lg text-sm text-white placeholder-gray-500 border transition-all duration-300 font-mono focus:outline-none ${
                                       leadEmailError
                                         ? "border-red-500/80 hover:border-red-500 focus:border-red-500 ring-1 ring-red-500/10"
                                         : "border-white/10 focus:border-brand-cyan"
                                    }`}
                                 />
                                 {leadEmailError && (
                                   <p className="text-red-400 text-[11px] mt-1.5 font-mono flex items-center gap-1 animate-pulse">
                                     <span>⚠️ {leadEmailError}</span>
                                   </p>
                                 )}
                              </div>
                              <button
                                 disabled={isSubmitting}
                                 type="submit"
                                 className="w-full bg-brand-cyan hover:bg-brand-cyan/90 disabled:opacity-50 text-brand-black font-semibold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(0,217,255,0.2)] hover:shadow-[0_4px_30px_rgba(0,217,255,0.3)] duration-300 transform hover:-translate-y-0.5 cursor-pointer font-sans"
                              >
                                 {isSubmitting ? (
                                    <>
                                       <span className="w-4 h-4 border-2 border-brand-black border-t-transparent animate-spin rounded-full"></span>
                                       <span>Enviando...</span>
                                    </>
                                 ) : (
                                    <>
                                       <Mail size={16} />
                                       <span>Quero meu guia gratuito</span>
                                    </>
                                 )}
                              </button>
                              <div className="text-[10px] text-gray-500 text-center font-mono mt-2">
                                 Respeitamos sua privacidade. Seus dados estão 100% seguros conosco.
                              </div>
                           </form>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </section>

          {/* --- BRAND FOOTER --- */}
          <footer className="py-12 px-6 border-t border-white/5 bg-black/40 relative z-10 font-sans print:border-none print:bg-transparent print:text-black">
             <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                   <div className="flex flex-col">
                      <span className="font-display font-bold text-lg leading-none tracking-tight text-white print:text-black">CÓDIGO-BASE</span>
                      <span className="text-[9px] uppercase tracking-widest text-[#00D9FF] font-mono mt-1 print:text-gray-600 font-semibold">Software & Hardware</span>
                   </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 font-mono print:text-gray-700">
                   <span>&copy; {new Date().getFullYear()} Código-Base. Todos os direitos reservados.</span>
                </div>

                <div className="flex items-center gap-3">
                   {/* 1. Print Optimized Version Trigger */}
                   <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-2 text-xs font-mono font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 print:hidden bg-white/5"
                      title="Versão para Impressão (Economia de Tinta)"
                   >
                      <Printer size={14} className="text-brand-orange" />
                      <span>Versão Impressa</span>
                   </button>

                   {/* 2. Copy Link Button */}
                   <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 text-xs font-mono font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95 print:hidden bg-white/5"
                      title="Copiar link da página"
                   >
                      <Copy size={14} className="text-[#00D9FF]" />
                      <span>Copiar Link</span>
                   </button>
                </div>
             </div>
          </footer>

      </main>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
          <button
             onClick={scrollToTop}
             className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-brand-black/90 border border-brand-cyan/30 text-brand-cyan flex items-center justify-center shadow-2xl hover:bg-brand-black hover:border-brand-cyan hover:scale-110 transition-all duration-300 group focus:outline-none active:scale-95"
             draggable={false}
          >
             <ChevronUp size={28} className="transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
       )}

      {/* --- FLOATING WHATSAPP INTERACTIVE CHAT WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
         <AnimatePresence>
            {/* 1. Animated Speech Bubble Prompt */}
            {showWaBubble && !isWaWidgetOpen && (
               <motion.div 
                  initial={{ opacity: 0, scale: 0.82, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.82, y: 12 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  onClick={() => { setIsWaWidgetOpen(true); setShowWaBubble(false); }}
                  className="w-72 bg-[#0b1021] border border-brand-cyan/40 p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] cursor-pointer hover:border-brand-cyan transition-all group/bubble relative"
               >
                  <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-white/5">
                     <span className="font-bold text-xs text-white flex items-center gap-2 font-display">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block"></span>
                        Matheus • Atendimento Online
                     </span>
                     <button 
                        onClick={(e) => { 
                           e.stopPropagation(); 
                           setShowWaBubble(false); 
                        }} 
                        className="text-gray-400 hover:text-white transition-colors duration-150 p-1 hover:bg-white/5 rounded"
                        title="Dismiss"
                     >
                        <X size={14} />
                     </button>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed font-sans mb-1">
                     Olá! Como podemos turbinar a tecnologia e disparar as vendas do seu negócio hoje? Converse comigo! 🚀
                  </p>
                  <div className="text-[10px] font-semibold text-brand-cyan mt-1 text-right group-hover/bubble:translate-x-1 transition-transform">
                     Iniciar chat &rarr;
                  </div>
                  {/* Bubble Tail */}
                  <div className="absolute right-6 top-full -mt-1 border-6 border-transparent border-t-[#0b1021]" />
               </motion.div>
            )}

            {/* 2. Interactive Chat Drawer Box */}
            {isWaWidgetOpen && (
               <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 40 }}
                  transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  className="w-80 md:w-88 bg-[#090e1a] border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col mb-2 shrink-0 select-none"
               >
                  {/* Chat Headbar */}
                  <div className="bg-gradient-to-r from-[#031533] to-[#042c4b] p-4 flex items-center justify-between border-b border-brand-cyan/20">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0c1222] border border-brand-cyan/40 p-0.5 relative shrink-0">
                           {/* Custom High-fidelity SVG Avatar of Assistant Matheus */}
                           <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="32" cy="32" r="30" fill="#0d1b32"/>
                              <path d="M18 28C18 20.2 24.2 14 32 14C39.8 14 46 20.2 46 28V34H18V28Z" fill="#132746"/>
                              <path d="M22 30C22 24.4 26.4 20 32 20C37.6 20 42 24.4 42 30V38C42 41.3 39.3 44 32 44C24.7 44 22 41.3 22 38V30Z" fill="#FAD1B0"/>
                              <rect x="25" y="27" width="5" height="4" rx="1" stroke="#00D9FF" strokeWidth="1"/>
                              <rect x="34" y="27" width="5" height="4" rx="1" stroke="#00D9FF" strokeWidth="1"/>
                              <line x1="30" y1="29" x2="34" y2="29" stroke="#00D9FF" strokeWidth="1"/>
                              <path d="M29 35.5C29.5 36.8 30.5 37.5 32 37.5C33.5 37.5 34.5 36.8 35 35.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round"/>
                              <path d="M20 50C20 46.6 22.6 44 26 44H38C41.4 44 44 46.6 44 50V56H20V50Z" fill="#1e293b"/>
                           </svg>
                           {/* Status Green Indicator */}
                           <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090e1a]"></span>
                        </div>
                        <div>
                           <h4 className="font-display font-bold text-sm text-white leading-tight">Matheus</h4>
                           <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-wider font-semibold">Tecnologia & Vendas</span>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsWaWidgetOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors duration-150 p-1.5 hover:bg-white/5 rounded-lg"
                        title="Close Chat"
                     >
                        <X size={16} />
                     </button>
                  </div>

                  {/* Chat Body Mockup Area */}
                  <div className="p-4 space-y-3.5 max-h-72 overflow-y-auto bg-[#050810]/50 text-xs">
                     {/* Assistant Greeting 1 */}
                     <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="bg-[#12213d] text-white p-3 rounded-2xl rounded-tl-none leading-relaxed font-sans shadow-md border border-white/[0.03]">
                           Olá! Sou o Matheus, Head de Tecnologia aqui na Código-Base. Como posso te apoiar hoje? 💻
                        </div>
                     </div>

                     {/* Assistant Greeting 2 */}
                     <div className="flex items-start gap-2 max-w-[85%]">
                        <div className="bg-[#12213d] text-white p-3 rounded-2xl rounded-tl-none leading-relaxed font-sans shadow-md border border-white/[0.03]">
                           Desenvolvemos automações completas, sites, aplicativos sob medida e dashboards personalizados para transformar sua operação. Fale o que você precisa!
                        </div>
                     </div>
                  </div>

                  {/* Message Input Form */}
                  <form 
                     onSubmit={(e) => {
                        e.preventDefault();
                        const finalMessage = userMessage.trim() || "Olá, Matheus! Gostaria de entender mais sobre as soluções de tecnologia da Código-Base.";
                        trackConversion("whatsapp_assistant_chat_sent", { typedMessage: finalMessage });
                        const link = `${WA_LINK}?text=${encodeURIComponent(finalMessage)}`;
                        window.open(link, "_blank", "noopener,noreferrer");
                        setIsWaWidgetOpen(false);
                     }}
                     className="p-3 border-t border-white/5 bg-[#090e1a] space-y-2.5"
                  >
                     <div className="relative">
                        <textarea
                           value={userMessage}
                           onChange={(e) => setUserMessage(e.target.value)}
                           placeholder="Digite sua mensagem ou ideia..."
                           className="w-full text-xs bg-brand-black/60 hover:bg-brand-black/90 focus:bg-brand-black rounded-xl p-3 pr-10 text-white placeholder-gray-500 border border-white/10 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 focus:outline-none transition-all duration-200 resize-none h-16 max-h-24 font-sans"
                        />
                        <button 
                           type="submit"
                           className="absolute right-3.5 bottom-3 text-brand-cyan hover:text-[#00c2eB] transition-colors p-1"
                           title="Submit Message"
                        >
                           <ArrowRight size={16} />
                        </button>
                     </div>
                     
                     <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-600/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/20"
                     >
                        <MessageCircle size={15} />
                        <span>Falar no WhatsApp Especialista</span>
                     </button>
                  </form>
               </motion.div>
            )}
         </AnimatePresence>

         {/* 3. Primary Floating Toggle Trigger */}
         <button
            onClick={() => {
               setIsWaWidgetOpen(!isWaWidgetOpen);
               setShowWaBubble(false);
               trackConversion("whatsapp_widget_button_clicked", { nextState: !isWaWidgetOpen });
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl relative select-none hover:scale-108 transition-all duration-300 pointer-events-auto bg-[#0a101f] border border-white/10 hover:border-brand-cyan/60 active:scale-95 cursor-pointer"
            draggable={false}
         >
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-40"></div>
            <div className="w-12 h-12 rounded-full overflow-hidden relative border border-white/5 bg-[#060c18] flex items-center justify-center shrink-0 z-10 p-0.5">
               {/* Matheus Avatar preview thumbnail */}
               <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="30" fill="#0d1b32"/>
                  <path d="M18 28C18 20.2 24.2 14 32 14C39.8 14 46 20.2 46 28V34H18V28Z" fill="#132746"/>
                  <path d="M22 30C22 24.4 26.4 20 32 20C37.6 20 42 24.4 42 30V38C42 41.3 39.3 44 32 44C24.7 44 22 41.3 22 38V30Z" fill="#FAD1B0"/>
                  <rect x="25" y="27" width="5" height="4" rx="1" stroke="#00D9FF" strokeWidth="1"/>
                  <rect x="34" y="27" width="5" height="4" rx="1" stroke="#00D9FF" strokeWidth="1"/>
                  <line x1="30" y1="29" x2="34" y2="29" stroke="#00D9FF" strokeWidth="1"/>
                  <path d="M29 35.5C29.5 36.8 30.5 37.5 32 37.5C33.5 37.5 34.5 36.8 35 35.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M20 50C20 46.6 22.6 44 26 44H38C41.4 44 44 46.6 44 50V56H20V50Z" fill="#1e293b"/>
               </svg>
               {/* Online marker dot */}
               <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#0d1b32] block"></span>
            </div>
         </button>
      </div>

       {/* Floating Quick Quote Button */}
       <div className="fixed bottom-6 left-6 z-40">
         <button
           onClick={() => setIsQuoteModalOpen(true)}
           className="flex items-center gap-2.5 bg-brand-cyan hover:bg-[#00c2eB] text-brand-black px-5 py-3.5 rounded-full font-bold shadow-[0_4px_20px_rgba(0,217,255,0.4)] hover:shadow-[0_4px_30px_rgba(0,217,255,0.6)] hover:scale-105 transition-all duration-300 group cursor-pointer"
         >
           <MousePointerClick size={18} className="animate-bounce" />
           <span className="text-sm font-sans">Pedir Orçamento Rápido</span>
         </button>
       </div>

       {/* Toast Notification for Urgency / Social Proof */}
       <AnimatePresence>
         {showToast && toast && (
           <motion.div
             initial={{ opacity: 0, x: -50, scale: 0.9 }}
             animate={{ opacity: 1, x: 0, scale: 1 }}
             exit={{ opacity: 0, x: -50, scale: 0.9 }}
             transition={{ type: "spring", stiffness: 300, damping: 25 }}
             className="fixed bottom-24 left-6 z-[45] max-w-sm glass-panel p-4 rounded-xl border border-brand-cyan/30 shadow-[0_4px_30px_rgba(0,217,255,0.15)] flex items-center gap-3.5"
           >
             <div className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan shrink-0">
               <Zap size={18} className="animate-pulse" />
             </div>
             <div className="flex-1">
               <div className="text-xs font-mono text-[#00d9ff] uppercase tracking-wide font-semibold">Novo Orçamento!</div>
               <p className="text-gray-200 text-xs mt-1 leading-relaxed">
                 <span className="font-bold text-white">{toast.name}</span> ({toast.city}) acabou de solicitar um orçamento para <span className="text-brand-orange font-semibold">{toast.service}</span>.
               </p>
             </div>
             <button 
               onClick={() => setShowToast(false)} 
               className="text-gray-500 hover:text-white transition-colors p-1"
             >
               <X size={15} />
             </button>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Quick Quote Modal */}
       <AnimatePresence>
         {isQuoteModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsQuoteModalOpen(false)}
               className="absolute inset-0 bg-brand-black/80 backdrop-blur-md"
             ></motion.div>
             
             {/* Modal Body */}
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               transition={{ type: "spring", duration: 0.5 }}
               className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-brand-cyan/20 shadow-[0_0_50px_rgba(0,217,255,0.15)] z-10 overflow-hidden"
             >
               <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl"></div>
               
               <button
                 onClick={() => { setIsQuoteModalOpen(false); setQuoteNameTouched(false); }}
                 className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
                 id="close-modal-btn"
               >
                 <X size={20} />
               </button>

               <div className="flex items-center gap-3 mb-6 font-sans">
                 <div className="w-10 h-10 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan shrink-0">
                   <Cpu size={20} className="animate-[spin_10s_linear_infinite]" />
                 </div>
                 <div>
                   <h3 className="font-display text-xl font-bold text-white tracking-tight">Solicitação de Orçamento</h3>
                   <p className="text-gray-400 text-[10px] font-mono uppercase tracking-wide text-brand-cyan font-bold font-semibold">Rápido, Grátis & Sem Compromisso</p>
                 </div>
               </div>

               <form onSubmit={handleQuoteSubmit} className="space-y-4 font-sans">
                 <div>
                   <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Seu Nome completo</label>
                   <input
                     type="text"
                     required
                     placeholder="Ex: Roberto Silva"
                     value={quoteName}
                     onChange={(e) => {
                       setQuoteName(e.target.value);
                       if (!quoteNameTouched) setQuoteNameTouched(true);
                     }}
                     onBlur={() => setQuoteNameTouched(true)}
                     className={`w-full bg-white/5 py-2.5 px-4 rounded-lg text-sm text-white placeholder-gray-500 border transition-all duration-300 font-mono focus:outline-none ${
                       quoteNameTouched && !quoteName.trim()
                         ? "border-red-500 hover:border-red-400 focus:border-red-500 ring-1 ring-red-500/10"
                         : "border-white/10 focus:border-brand-cyan"
                     }`}
                    />
                    {quoteNameTouched && !quoteName.trim() && (
                      <p className="text-red-400 text-[11px] mt-1.5 font-mono flex items-center gap-1 animate-pulse">
                        <span>⚠️ Como podemos te chamar? Nome completo é obrigatório.</span>
                      </p>
                    )}
                 </div>

                 <div>
                   <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Tipo de Serviço</label>
                   <select
                     value={quoteService}
                     onChange={(e) => setQuoteService(e.target.value)}
                     className="w-full bg-brand-black/95 py-2.5 px-4 rounded-lg text-sm text-white border border-white/10 focus:outline-none focus:border-brand-cyan transition-colors font-mono cursor-pointer"
                   >
                     <option value="Sistemas & Apps Personalizados">Sistemas & Apps Personalizados</option>
                     <option value="Inteligência Artificial & Chatbots">Inteligência Artificial & Chatbots</option>
                     <option value="Identidade Visual & Instagram">Identidade Visual & Instagram</option>
                     <option value="Suporte de Hardware & Redes">Suporte de Hardware & Redes</option>
                     <option value="Análise de Dados / Power BI">Análise de Dados / Power BI</option>
                     <option value="Outro / Projeto Especial">Outro / Projeto Especial</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Urgência do Projeto</label>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     {[
                       "⚡ Urgência Máxima",
                       "📅 Médio Prazo",
                       "💬 Apenas Cotando"
                     ].map((urg) => (
                       <button
                         key={urg}
                         type="button"
                         onClick={() => setQuoteUrgency(urg)}
                         className={`py-2 px-3 rounded-lg text-xs font-mono text-center border transition-all cursor-pointer ${
                           quoteUrgency === urg
                             ? "bg-brand-cyan/20 border-brand-cyan text-white shadow-[0_0_15px_rgba(0,217,255,0.15)] font-bold"
                             : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10"
                         }`}
                       >
                         {urg}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-mono text-[#00d9ff] mb-1.5 uppercase tracking-wide">Detalhes adicionais (Opcional)</label>
                   <textarea
                     rows={3}
                     placeholder="Conte resumidamente seu objetivo ou problema..."
                     value={quoteDetails}
                     onChange={(e) => setQuoteDetails(e.target.value)}
                     className="w-full bg-white/5 py-2 px-4 rounded-lg text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-brand-cyan transition-all font-mono resize-none"
                   ></textarea>
                 </div>

                 <button
                   type="submit"
                   className="w-full bg-brand-cyan hover:bg-[#00c2eB] text-brand-black font-semibold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(0,217,255,0.2)] hover:shadow-[0_4px_30px_rgba(0,217,255,0.3)] duration-300 transform hover:-translate-y-0.5 cursor-pointer font-bold"
                 >
                   <MessageCircle size={16} />
                   <span>Enviar para WhatsApp</span>
                 </button>
               </form>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
