declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, tenant_id, registration_code } = await req.json();

    if (!email || !password || !tenant_id || !registration_code) {
      throw new Error("Campos obrigatórios ausentes: email, senha, escola e matrícula.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Verificar se a matrícula existe e está disponível (user_id IS NULL)
    const { data: studentData, error: studentFetchError } = await supabaseAdmin
      .from("students")
      .select("id, full_name")
      .eq("tenant_id", tenant_id)
      .eq("registration_code", registration_code)
      .is("user_id", null)
      .maybeSingle();

    if (studentFetchError) throw studentFetchError;
    if (!studentData) {
      throw new Error("Matrícula inválida, já utilizada ou não encontrada para esta escola.");
    }
    
    const studentId = studentData.id;
    const studentName = studentData.full_name;

    // 2. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: studentName,
        }
      }
    });

    if (authError) {
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }
    
    const userId = authData.user?.id;
    if (!userId) {
        throw new Error("Falha ao obter ID do usuário após o cadastro.");
    }

    // 3. Atualizar o registro do aluno com o user_id
    const { error: studentUpdateError } = await supabaseAdmin
      .from("students")
      .update({ user_id: userId })
      .eq("id", studentId);

    if (studentUpdateError) {
      // NOTA: Em caso de falha aqui, o usuário foi criado no Auth, mas não vinculado.
      // Em produção, seria necessário um rollback ou um mecanismo de correção.
      console.error("Error linking user to student record:", studentUpdateError);
      throw new Error(`Erro ao vincular usuário ao registro do aluno: ${studentUpdateError.message}`);
    }
    
    // 4. Atualizar o perfil (profiles) para garantir a role correta (student)
    // O trigger handle_new_user já deve ter criado o perfil, mas garantimos a role e o tenant_id
    const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ 
            tenant_id: tenant_id, 
            role: 'student',
            first_name: studentName.split(' ')[0],
            last_name: studentName.split(' ').slice(1).join(' ') || null,
        })
        .eq("id", userId);

    if (profileUpdateError) {
        console.error("Error updating profile role/tenant:", profileUpdateError);
        // Continuar, pois o vínculo principal (students.user_id) foi feito.
    }


    return new Response(JSON.stringify({ success: true, userId: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (register-student):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});