import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { showError, showSuccess } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Definindo o tipo para a configuração JSONB
interface TenantConfig {
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

// Definindo o tipo para os dados do tenant
interface TenantInfo {
  id: string;
  name: string;
  config: TenantConfig | null;
}

const schoolInfoSchema = z.object({
  name: z.string().min(3, "O nome da escola é obrigatório."),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido.").optional().or(z.literal("")),
  address: z.string().optional(),
});

const fetchSchoolInfo = async (tenantId: string | null): Promise<TenantInfo | null> => {
  if (!tenantId) return null;

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, config")
    .eq("id", tenantId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const SchoolInfoForm = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const form = useForm<z.infer<typeof schoolInfoSchema>>({
    resolver: zodResolver(schoolInfoSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const { data: schoolInfo, isLoading: isFetchingSchoolInfo, error: fetchError } = useQuery({
    queryKey: ["tenantInfo", tenantId],
    queryFn: () => fetchSchoolInfo(tenantId),
    enabled: !!tenantId,
  });

  useEffect(() => {
    if (schoolInfo) {
      form.reset({
        name: schoolInfo.name,
        cnpj: schoolInfo.config?.cnpj || "",
        phone: schoolInfo.config?.phone || "",
        email: schoolInfo.config?.email || "",
        address: schoolInfo.config?.address || "",
      });
    }
  }, [schoolInfo, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof schoolInfoSchema>) => {
      if (!tenantId) throw new Error("ID da escola não encontrado.");

      const { name, cnpj, phone, email, address } = values;

      const updatedConfig: TenantConfig = {
        cnpj: cnpj || null, // Converte string vazia para null
        phone: phone || null, // Converte string vazia para null
        email: email || null, // Converte string vazia para null
        address: address || null, // Converte string vazia para null
      };

      const { error } = await supabase
        .from("tenants")
        .update({ name, config: updatedConfig })
        .eq("id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Informações da escola salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["tenantInfo", tenantId] });
    },
    onError: (error: any) => {
      showError(`Erro ao salvar informações da escola: ${error.message}`);
    },
  });

  const onSubmit = (values: z.infer<typeof schoolInfoSchema>) => {
    updateMutation.mutate(values);
  };

  const isLoading = isFetchingSchoolInfo || updateMutation.isPending;

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro ao carregar informações da escola</CardTitle>
          <CardDescription className="text-red-500">{fetchError.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Escola</CardTitle>
        <CardDescription>Atualize os dados cadastrais da sua instituição de ensino.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Escola</FormLabel>
                  <FormControl>
                    <Input placeholder="Colégio Exemplo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0001-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@escola.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua Exemplo, 123, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SchoolInfoForm;