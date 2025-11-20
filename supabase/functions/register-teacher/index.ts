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
    const { email, password, tenant_id, full_name } = await req.json();

    if (!email || !password || !tenant_id || !full_name) {
      throw new Error("Campos obrigatórios ausentes: email, senha, nome completo e escola.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Criar o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: full_name,
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
    
    // 2. Criar um registro de funcionário (Professor)
    // NOTA: O salário base e a data de contratação são obrigatórios no schema,
    // mas como o professor está se cadastrando, usamos valores padrão/placeholder.
    const now = new Date().toISOString().split('T')[0];
    const employeeData = {
        tenant_id: tenant_id,
        full_name: full_name,
        is_teacher: true,
        status: 'active',
        user_id: userId,
        base_salary: 0.00, // Placeholder
        hire_date: now, // Data de cadastro
        email: email,
    };

    const { data: employeeResult, error: employeeInsertError } = await supabaseAdmin
      .from("employees")
      .insert(employeeData)
      .select("id")
      .single();

    if (employeeInsertError) {
      console.error("Error inserting employee record:", employeeInsertError);
      // Em caso de falha, o usuário foi criado no Auth. Em produção, seria necessário um rollback.
      throw new Error(`Erro ao criar registro de professor: ${employeeInsertError.message}`);
    }
    
    const employeeId = employeeResult.id;

    // 3. Atualizar o perfil (profiles) para garantir a role correta (teacher) e vincular employee_id
    // O trigger handle_new_user já deve ter criado o perfil, mas garantimos a role, tenant_id e employee_id
    const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ 
            tenant_id: tenant_id, 
            role: 'teacher',
            employee_id: employeeId,
            first_name: full_name.split(' ')[0],
            last_name: full_name.split(' ').slice(1).join(' ') || null,
        })
        .eq("id", userId);

    if (profileUpdateError) {
        console.error("Error updating profile role/tenant/employee_id:", profileUpdateError);
        // Continuar, pois o registro principal (employees) foi feito.
    }

    return new Response(JSON.stringify({ success: true, userId: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error (register-teacher):", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});