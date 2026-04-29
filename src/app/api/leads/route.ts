import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { getResend } from "@/lib/resend/client";

function normalizeField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const nome = normalizeField(body.nome);
    const email = normalizeField(body.email);
    const whatsapp = normalizeField(body.whatsapp);
    const empresa = normalizeField(body.empresa);
    const mensagem = normalizeField(body.mensagem);
    const tipoServico = normalizeField(body.tipo_servico);
    const fonte = normalizeField(body.fonte) || "site";

    if (!nome || !email || !whatsapp || !tipoServico || !mensagem) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios" },
        { status: 400 }
      );
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";
    const userAgent = headersList.get("user-agent") || "";

    const url = new URL(request.url);
    const utmSource = url.searchParams.get("utm_source") || "";
    const utmMedium = url.searchParams.get("utm_medium") || "";
    const utmCampaign = url.searchParams.get("utm_campaign") || "";
    const utmTerm = url.searchParams.get("utm_term") || "";
    const utmContent = url.searchParams.get("utm_content") || "";

    const leadData = {
      nome,
      email,
      whatsapp,
      empresa,
      mensagem,
      tipo_servico: tipoServico,
      fonte,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      ip,
      user_agent: userAgent,
      status: "novo",
      score: 0,
    };

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

    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      tipo: "lead_criado",
      payload_json: { fonte },
      ator_tipo: "sistema",
    });

    const notificationEmail = process.env.LEAD_NOTIFICATION_EMAIL;
    const from = process.env.RESEND_FROM;
    const replyTo = process.env.RESEND_REPLY_TO || email;

    const resendClient = getResend();
    if (resendClient && notificationEmail && from) {
      try {
        await resendClient.emails.send({
          from,
          to: notificationEmail,
          replyTo,
          subject: `Novo lead Código Base: ${nome}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
              <h1 style="margin:0 0 16px;color:#0A0E1A">Novo lead pelo site</h1>
              <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
              <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
              <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>
              <p><strong>Empresa:</strong> ${escapeHtml(empresa || "Não informado")}</p>
              <p><strong>Tipo de serviço:</strong> ${escapeHtml(tipoServico)}</p>
              <p><strong>Fonte:</strong> ${escapeHtml(fonte)}</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
              <p><strong>Mensagem:</strong></p>
              <p>${escapeHtml(mensagem).replaceAll("\n", "<br />")}</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Erro ao enviar notificação de lead:", emailError);
      }
    }

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

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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
