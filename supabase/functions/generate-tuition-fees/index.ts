import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const body = await req.json()
    const { tenant_id, academic_period_id, year, base_amount, due_day, description } = body

    if (!tenant_id || !year || !base_amount || !due_day) {
      throw new Error('Missing required fields: tenant_id, year, base_amount, due_day')
    }

    console.log(`[generate-tuition-fees] Starting generation for tenant: ${tenant_id}, year: ${year}`)

    // 1. Buscar alunos ativos do tenant
    const { data: students, error: studentsError } = await supabaseClient
      .from('students')
      .select('id, full_name')
      .eq('tenant_id', tenant_id)
      .eq('status', 'active')

    if (studentsError) throw studentsError

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: 'No active students found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Gerar mensalidades (Janeiro a Dezembro)
    const feesToInsert = []
    const currentYear = parseInt(year)

    for (const student of students) {
      for (let month = 1; month <= 12; month++) {
        // Criar data de vencimento (dia X de cada mês)
        const dueDate = new Date(currentYear, month - 1, due_day)
        
        feesToInsert.push({
          tenant_id,
          student_id: student.id,
          academic_period_id: academic_period_id || null,
          amount: base_amount,
          due_date: dueDate.toISOString().split('T')[0],
          description: description || `Mensalidade ${month}/${currentYear}`,
          status: 'pendente'
        })
      }
    }

    // 3. Inserir no banco de dados usando RPC para evitar duplicatas simples ou inserção direta
    // Para simplificar, faremos inserção direta, mas em produção recomenda-se checar duplicatas
    const { error: insertError } = await supabaseClient
      .from('tuition_fees')
      .insert(feesToInsert)

    if (insertError) {
      console.error('[generate-tuition-fees] Insert error:', insertError)
      // Pode ser erro de duplicidade (unique constraint), se houver, ignorar ou tratar
      // Por enquanto, lançamos erro
      throw new Error(`Failed to insert fees: ${insertError.message}`)
    }

    console.log(`[generate-tuition-fees] Successfully generated ${feesToInsert.length} fees.`)

    return new Response(
      JSON.stringify({ message: 'Success', count: feesToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[generate-tuition-fees] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})