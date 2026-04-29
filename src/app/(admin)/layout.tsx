"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BarChart2, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/media", label: "Mídia", icon: ImageIcon },
  { href: "/admin/whatsapp", label: "WhatsApp", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const Sidebar = () => (
    <aside className="flex h-full w-64 flex-col border-r border-[#1E2D45] bg-[#0A0E1A]">
      <div className="flex items-center gap-2.5 border-b border-[#1E2D45] px-5 py-4">
        <Image
          src="/logo-oficial.png"
          alt="Código Base"
          width={36}
          height={36}
          className="rounded-full drop-shadow-[0_0_6px_rgba(0,200,232,0.25)]"
        />
        <span className="flex items-center font-extrabold tracking-[0.04em] text-sm leading-none">
          <span className="text-[#00C8E8]">CÓDIGO</span>
          <span className="text-[#5A7090] mx-px">-</span>
          <span className="text-[#FF7A00]">BASE</span>
        </span>
        <span className="ml-auto rounded-full bg-[#FF7A00]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF7A00]">Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-[#111827] text-[#00C8E8]"
                : "text-[#7A8BA8] hover:bg-[#111827] hover:text-[#EDF2F7]"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[#1E2D45] p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#7A8BA8] transition-colors hover:bg-[#111827] hover:text-[#FF7A00]"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0E1A] text-[#EDF2F7]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b border-[#1E2D45] bg-[#0A0E1A] px-6 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-[#7A8BA8] hover:text-[#EDF2F7]"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm text-[#7A8BA8]">
            <BarChart2 className="h-4 w-4" />
            <span>Painel de controle</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
