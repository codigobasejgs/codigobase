import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Capturar informações do request
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";
    const userAgent = headersList.get("user-agent") || "";

    // Capturar UTM parameters da URL (se houver)
    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source") || "";
    const utmMedium = url.searchParams.get("utm_medium") || "";
    const utmCampaign = url.searchParams.get("utm_campaign") || "";
    const utmTerm = url.searchParams.get("utm_term") || "";
    const utmContent = url.searchParams.get("utm_content") || "";

    // Preparar dados do lead
    const leadData = {
      nome: body.nome || "",
      email: body.email || "",
      whatsapp: body.whatsapp || "",
      empresa: body.empresa || "",
      mensagem: body.mensagem || "",
      tipo_servico: body.tipo_servico || "",
      fonte: body.fonte || "site",
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      ip: ip,
      user_agent: userAgent,
      status: "novo",
      score: 0,
    };

    // Inserir lead no Supabase
    const { data: lead, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao inserir lead:", error);
      return NextResponse.json(
        { error: "Erro ao salvar lead" },
        { status: 500 }
      );
    }

    // Criar evento de lead criado
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      tipo: "lead_criado",
      payload_json: { fonte: "formulario_contato" },
      ator_tipo: "sistema",
    });

    // TODO: Enviar notificação via WhatsApp (Evolution API)
    // TODO: Enviar e-mail de confirmação (Resend)
    // TODO: Disparar workflow Inngest

    return NextResponse.json(
      { success: true, lead_id: lead.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na API de leads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar se usuário é admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar leads (apenas admins podem ver)
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar leads" },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("Erro na API de leads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
