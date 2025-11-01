declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const kiwifyApiKey = Deno.env.get("KIWIFY_API_KEY");

    if (!kiwifyApiKey) {
      throw new Error("Chave da API do Kiwify não configurada.");
    }

    // --- SIMULAÇÃO DE CHAMADA À API DO KIWIFY ---
    // Em um cenário real, você faria uma requisição HTTP para a API do Kiwify aqui.
    // Exemplo:
    // const kiwifyResponse = await fetch("https://api.kiwify.com.br/v1/sales/summary", {
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${kiwifyApiKey}`,
    //   },
    // });
    //
    // if (!kiwifyResponse.ok) {
    //   const errorText = await kiwifyResponse.text();
    //   throw new Error(`Erro na API do Kiwify: ${kiwifyResponse.status} - ${errorText}`);
    // }
    //
    // const kiwifyData = await kiwifyResponse.json();
    // const totalSales = kiwifyData.totalSales; // Supondo que a resposta tenha um campo totalSales

    // Para fins de demonstração, vamos usar dados mockados:
    const totalSales = Math.floor(Math.random() * 100000) + 50000; // Valor aleatório entre 50.000 e 150.000
    const totalSubscriptions = Math.floor(Math.random() * 50) + 10; // Valor aleatório entre 10 e 60

    return new Response(JSON.stringify({
      totalSales: totalSales,
      totalSubscriptions: totalSubscriptions,
    }), {
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