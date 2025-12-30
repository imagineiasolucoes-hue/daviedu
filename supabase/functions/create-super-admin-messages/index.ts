import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create the super_admin_messages table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.super_admin_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
        target_role user_role[] NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true,
        link_url TEXT,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
      );
    `;

    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableQuery
    });

    if (tableError) {
      console.error("Table creation error:", tableError);
      throw new Error(`Failed to create table: ${tableError.message}`);
    }

    // Enable RLS
    const enableRlsQuery = `
      ALTER TABLE public.super_admin_messages ENABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: enableRlsQuery
    });

    if (rlsError) {
      console.error("RLS enable error:", rlsError);
      throw new Error(`Failed to enable RLS: ${rlsError.message}`);
    }

    // Create policies
    const policiesQuery = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "super_admins_manage_all_messages" ON public.super_admin_messages;
      DROP POLICY IF EXISTS "users_read_relevant_messages" ON public.super_admin_messages;

      -- Policy: Only super admins can manage all messages
      CREATE POLICY "super极速赛车开奖直播历史记录+开奖结果
      CREATE POLICY "super_admins_manage_all_messages" ON public.super_admin_messages
      FOR ALL TO authenticated
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
      )
      WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
      );

      -- Policy: Users can read messages targeted to their tenant and role
      CREATE POLICY "users_read_relevant_messages" ON public.super_admin_messages
      FOR SELECT TO authenticated
      USING (
        is_active = true AND (
          -- Global messages (no tenant specified)
          (tenant_id IS NULL AND target_role @> ARRAY[(SELECT role FROM public.profiles WHERE id = auth.uid())::user_role]) OR
          -- Tenant-specific messages
          (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) AND target_role @> ARRAY[(SELECT role FROM public.profiles WHERE id = auth.uid())::user_role])
        )
      );
    `;

    const { error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: policiesQuery
    });

    if (policiesError) {
      console.error("Policies creation error:", policiesError);
      throw new Error(`Failed to create policies: ${policiesError.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "super_admin_messages table and policies created successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type极速赛车开奖直播历史记录+开奖结果
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});