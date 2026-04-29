import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const nome = typeof body.nome === "string" ? body.nome.trim() : "Admin";

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Só cria se não existir nenhum admin ainda
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Setup já foi realizado. Não é possível criar mais usuários por esta rota." },
        { status: 403 }
      );
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError) {
      console.error("Erro ao criar usuário:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Atualiza o nome no profile criado pelo trigger
    if (authData.user) {
      await admin
        .from("profiles")
        .update({ nome })
        .eq("id", authData.user.id);
    }

    return NextResponse.json({ success: true, message: "Usuário admin criado com sucesso." }, { status: 201 });
  } catch (error) {
    console.error("Erro no setup:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
