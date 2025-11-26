import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Save, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Tipos e Schemas ---
const templateSchema = z.object({
  name: z.string().min(3, "O nome do template é obrigatório."),
  content: z.string().min(50, "O conteúdo do contrato é muito curto."),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
}

// Variáveis disponíveis para o administrador
const dynamicVariables = [
  { key: '{{school_name}}', description: 'Nome da Escola' },
  { key: '{{student_name}}', description: 'Nome Completo do Aluno' },
  { key: '{{student_registration_code}}', description: 'Matrícula do Aluno' },
  { key: '{{student_birth_date}}', description: 'Data de Nascimento do Aluno' },
  { key: '{{class_name}}', description: 'Nome da Turma' },
  { key: '{{course_name}}', description: 'Nome da Série/Ano' },
  { key: '{{guardian_name}}', description: 'Nome do Responsável Principal' },
  { key: '{{guardian_cpf}}', description: 'CPF do Responsável Principal' },
  { key: '{{current_date}}', description: 'Data de Geração do Contrato' },
  { key: '{{monthly_fee_value}}', description: 'Valor da Mensalidade (Mock)' },
];

// --- Funções de Busca de Dados ---
const fetchActiveTemplate = async (tenantId: string): Promise<ContractTemplate | null> => {
  const { data, error } = await supabase
    .from('contract_templates')
    .select('id, name, content, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const ContractTemplateForm: React.FC = () => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: activeTemplate, isLoading: isLoadingTemplate } = useQuery<ContractTemplate | null, Error>({
    queryKey: ['contractTemplate', tenantId],
    queryFn: () => fetchActiveTemplate(tenantId!),
    enabled: !!tenantId,
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
  });

  useEffect(() => {
    if (activeTemplate) {
      form.reset({
        name: activeTemplate.name,
        content: activeTemplate.content,
      });
    } else {
        // Define um template inicial se não houver nenhum
        form.reset({
            name: "Contrato Padrão de Matrícula",
            content: `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

Pelo presente instrumento particular, de um lado, {{school_name}}, doravante denominada ESCOLA, e de outro lado, {{guardian_name}}, portador do CPF {{guardian_cpf}}, doravante denominado CONTRATANTE, têm justo e contratado o seguinte:

CLÁUSULA PRIMEIRA - OBJETO
O objeto deste contrato é a prestação de serviços educacionais para o aluno(a) {{student_name}}, Matrícula nº {{student_registration_code}}, na Série/Ano {{course_name}}, Turma {{class_name}}.

CLÁUSULA SEGUNDA - VALOR
O valor da mensalidade é de {{monthly_fee_value}}, a ser pago até o dia 5 de cada mês.

CLÁUSULA TERCEIRA - VIGÊNCIA
O presente contrato tem vigência a partir de {{current_date}} até o final do ano letivo.

[Adicione aqui suas cláusulas legais específicas]

Ao assinar digitalmente, o CONTRATANTE declara ter lido e concordado com todos os termos.
`,
        });
    }
  }, [activeTemplate, form]);

  const mutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const templateData = {
        ...data,
        tenant_id: tenantId,
        is_active: true,
      };

      if (activeTemplate) {
        // Atualiza o template existente
        const { error } = await supabase
          .from('contract_templates')
          .update(templateData)
          .eq('id', activeTemplate.id)
          .eq('tenant_id', tenantId);
        if (error) throw new Error(error.message);
      } else {
        // Insere um novo template
        const { error } = await supabase
          .from('contract_templates')
          .insert(templateData);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Template de Contrato salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['contractTemplate', tenantId] });
    },
    onError: (error) => {
      toast.error("Erro ao Salvar Template", { description: error.message });
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Template de Contrato de Matrícula
        </CardTitle>
        <CardDescription>
          Defina o texto padrão do contrato da sua escola. Use as variáveis dinâmicas abaixo para personalizar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Instruções Importantes</AlertTitle>
            <AlertDescription className="text-sm">
              Use as variáveis entre chaves duplas (ex: <code>{'{{student_name}}'}</code>) no campo de conteúdo. Elas serão substituídas automaticamente pelos dados do aluno e da escola no momento da geração.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Template</Label>
            <Input id="name" {...form.register("name")} disabled={isLoadingTemplate} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo do Contrato (Texto Simples)</Label>
            <Textarea 
              id="content" 
              {...form.register("content")} 
              rows={15} 
              placeholder="Insira o texto completo do seu contrato aqui..."
              className="font-mono text-sm"
            />
            {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
          </div>

          <Separator />

          {/* Lista de Variáveis */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Variáveis Dinâmicas Disponíveis:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-muted/50 p-3 rounded-md">
              {dynamicVariables.map(v => (
                <div key={v.key} className="truncate">
                  <code className="font-mono text-primary">{v.key}</code>: {v.description}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={mutation.isPending || isLoadingTemplate}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContractTemplateForm;