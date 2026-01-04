declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore
import { createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts"; // Para verificar a assinatura do webhook

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kiwifyWebhookSecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    if (!kiwifyWebhookSecret) {
      throw new Error("KIWIFY_WEBHOOK_SECRET not set in environment variables.");
    }

    const signature = req.headers.get("X-Kiwify-Signature");
    const rawBody = await req.text(); // Ler o corpo da requisição como texto para verificação da assinatura

    if (!signature) {
      return new Response(JSON.stringify({ error: "Webhook signature missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Verificar a assinatura do webhook
    const hmac = createHmac("sha256", kiwifyWebhookSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    if (signature !== expectedSignature) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event; // Ex: "purchase_approved", "purchase_refunded"
    const transaction = payload.data; // Dados da transação

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Usar service_role key para ignorar RLS
    );

    console.log(`Kiwify Webhook received: ${eventType} for transaction ${transaction.id}`);

    // Lógica para processar o evento
    switch (eventType) {
      case "purchase_approved":
      case "subscription_activated":
        // 1. Registrar a compra
        const { data: purchaseData, error: purchaseError } = await supabaseAdmin
          .from('kiwify_purchases')
          .upsert({
            kiwify_product_id: transaction.product_id,
            buyer_email: transaction.customer_email,
            purchase_date: new Date(transaction.purchase_date).toISOString(),
            status: transaction.status,
            amount: transaction.amount,
            transaction_id: transaction.id,
          }, { onConflict: 'transaction_id' }) // Atualiza se a transação já existir
          .select()
          .single();

        if (purchaseError) {
          console.error("Error upserting kiwify purchase:", purchaseError);
          throw new Error(`Erro ao registrar compra: ${purchaseError.message}`);
        }

        // 2. Mapear produto Kiwify para curso interno
        const { data: kiwifyProduct, error: kiwifyProductError } = await supabaseAdmin
          .from('kiwify_products')
          .select('course_id')
          .eq('kiwify_product_id', transaction.product_id)
          .single();

        if (kiwifyProductError || !kiwifyProduct) {
          console.warn(`Kiwify product ID ${transaction.product_id} not mapped to an internal course.`);
          // Pode-se optar por enviar um e-mail de alerta aqui
          return new Response(JSON.stringify({ message: "Product not mapped, purchase recorded." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const courseId = kiwifyProduct.course_id;

        // 3. Encontrar ou criar usuário no seu sistema
        let userId = purchaseData.user_id;
        if (!userId) {
          const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tenant_id')
            .eq('email', transaction.customer_email)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error("Error fetching profile by email:", profileError);
            throw new Error(`Erro ao buscar perfil do comprador: ${profileError.message}`);
          }

          if (profileData) {
            userId = profileData.id;
            // Atualizar purchaseData com user_id
            await supabaseAdmin.from('kiwify_purchases').update({ user_id: userId }).eq('id', purchaseData.id);
          } else {
            // Se o usuário não existe, você pode optar por:
            // a) Criar um novo usuário (requer mais lógica, ex: senha temporária, convite)
            // b) Apenas registrar a compra e esperar que o usuário se cadastre com o mesmo e-mail
            // Por simplicidade, vamos apenas registrar a compra e não conceder acesso automático se o usuário não existir.
            console.warn(`User with email ${transaction.customer_email} not found in profiles. Access not granted automatically.`);
            return new Response(JSON.stringify({ message: "User not found, purchase recorded." }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }

        // 4. Conceder acesso ao curso (assumindo tabela student_courses)
        // Primeiro, verificar se o usuário é um estudante e qual o student_id
        const { data: studentData, error: studentError } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (studentError || !studentData) {
          console.warn(`User ID ${userId} is not linked to a student profile. Access not granted.`);
          return new Response(JSON.stringify({ message: "User is not a student, access not granted." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        const studentId = studentData.id;

        const { error: studentCourseError } = await supabaseAdmin
          .from('student_courses') // Assumindo que esta é a tabela de acesso a cursos
          .upsert({
            student_id: studentId,
            course_id: courseId,
            access_granted_at: new Date().toISOString(),
          }, { onConflict: ['student_id', 'course_id'] });

        if (studentCourseError) {
          console.error("Error granting student course access:", studentCourseError);
          throw new Error(`Erro ao conceder acesso ao curso: ${studentCourseError.message}`);
        }

        console.log(`Access granted for student ${studentId} to course ${courseId}`);
        break;

      case "purchase_refunded":
      case "subscription_canceled":
        // Lógica para remover acesso em caso de reembolso/cancelamento
        const { data: refundedPurchase, error: refundedPurchaseError } = await supabaseAdmin
          .from('kiwify_purchases')
          .update({ status: transaction.status })
          .eq('transaction_id', transaction.id)
          .select('user_id, kiwify_product_id')
          .single();

        if (refundedPurchaseError || !refundedPurchase) {
          console.error("Error updating refunded purchase status:", refundedPurchaseError);
          throw new Error(`Erro ao atualizar status de reembolso: ${refundedPurchaseError?.message}`);
        }

        const refundedUserId = refundedPurchase.user_id;
        const refundedKiwifyProductId = refundedPurchase.kiwify_product_id;

        if (refundedUserId) {
          const { data: kiwifyProductMap, error: kiwifyProductMapError } = await supabaseAdmin
            .from('kiwify_products')
            .select('course_id')
            .eq('kiwify_product_id', refundedKiwifyProductId)
            .single();

          if (kiwifyProductMapError || !kiwifyProductMap) {
            console.warn(`Refunded Kiwify product ID ${refundedKiwifyProductId} not mapped. Cannot remove access.`);
          } else {
            const refundedCourseId = kiwifyProductMap.course_id;
            
            // Primeiro, verificar se o usuário é um estudante e qual o student_id
            const { data: studentData, error: studentError } = await supabaseAdmin
              .from('students')
              .select('id')
              .eq('user_id', refundedUserId)
              .single();

            if (studentError || !studentData) {
              console.warn(`User ID ${refundedUserId} is not linked to a student profile. Cannot remove access.`);
            } else {
              const refundedStudentId = studentData.id;

              const { error: removeAccessError } = await supabaseAdmin
                .from('student_courses')
                .delete()
                .eq('student_id', refundedStudentId)
                .eq('course_id', refundedCourseId);

              if (removeAccessError) {
                console.error("Error removing student course access:", removeAccessError);
                throw new Error(`Erro ao remover acesso ao curso: ${removeAccessError.message}`);
              }
              console.log(`Access removed for student ${refundedStudentId} from course ${refundedCourseId}`);
            }
          }
        }
        break;

      default:
        console.log(`Unhandled Kiwify event type: ${eventType}`);
        break;
    }

    return new Response(JSON.stringify({ message: "Webhook processed successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    console.error("Edge Function CATCH block error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});