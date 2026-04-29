import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUS = ["novo", "qualificado", "em_atendimento", "ganho", "perdido"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = typeof body.status === "string" ? body.status : "";

    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar lead" }, { status: 500 });
    }

    await supabase.from("lead_events").insert({
      lead_id: id,
      tipo: `status_alterado_para_${status}`,
      payload_json: { status_anterior: body.status_anterior ?? null, novo_status: status },
      ator_tipo: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH lead:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
