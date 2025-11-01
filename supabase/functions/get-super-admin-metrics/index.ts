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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString();

    const [
      totalTenantsRes,
      activeTenantsRes,
      trialTenantsRes,
      suspendedTenantsRes,
      newTenantsLast30DaysRes,
      totalUsersRes,
      usersByRoleRes,
      totalStudentsRes,
      totalTeachersRes,
      totalClassesRes,
      top5SchoolsByStudentsRes,
    ] = await Promise.all([
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('role'), // Fetch all roles to count them
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('employees').select('*', { count: 'exact', head: true }).eq('is_teacher', true).eq('status', 'active'),
      supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }),
      supabaseAdmin.rpc('get_top_tenants_by_student_count'), // Chamando a função SQL
    ]);

    // Handle errors for all promises
    const errors = [
      totalTenantsRes.error, activeTenantsRes.error, trialTenantsRes.error, suspendedTenantsRes.error,
      newTenantsLast30DaysRes.error, totalUsersRes.error, usersByRoleRes.error, totalStudentsRes.error,
      totalTeachersRes.error, totalClassesRes.error, top5SchoolsByStudentsRes.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error("Errors fetching super admin metrics:", errors);
      throw new Error("Failed to fetch all super admin metrics.");
    }

    // Process users by role
    const usersByRoleCounts = usersByRoleRes.data?.reduce((acc: { [key: string]: number }, profile: { role: string }) => {
      acc[profile.role] = (acc[profile.role] || 0) + 1;
      return acc;
    }, {});

    const metrics = {
      totalTenants: totalTenantsRes.count ?? 0,
      activeTenants: activeTenantsRes.count ?? 0,
      trialTenants: trialTenantsRes.count ?? 0,
      suspendedTenants: suspendedTenantsRes.count ?? 0,
      newTenantsLast30Days: newTenantsLast30DaysRes.count ?? 0,
      totalUsers: totalUsersRes.count ?? 0,
      usersByRole: usersByRoleCounts ?? {},
      totalStudents: totalStudentsRes.count ?? 0,
      totalTeachers: totalTeachersRes.count ?? 0,
      totalClasses: totalClassesRes.count ?? 0,
      top5SchoolsByStudents: top5SchoolsByStudentsRes.data ?? [],
    };

    return new Response(JSON.stringify(metrics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});