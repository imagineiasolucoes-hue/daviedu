"use client";

import React, { useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, ShieldCheck, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UserRole } from '@/hooks/useProfile'; // Importar UserRole

// Definir as funcionalidades que podem ter permissões configuradas
const features = [
  { key: 'dashboard', label: 'Dashboard', roles: ['teacher', 'secretary'] },
  { key: 'students', label: 'Gestão de Alunos', roles: ['secretary'] },
  { key: 'teachers', label: 'Gestão de Professores', roles: ['secretary'] },
  { key: 'classes', label: 'Gestão de Turmas', roles: ['secretary'] },
  { key: 'courses', label: 'Gestão de Séries/Anos', roles: ['secretary'] },
  { key: 'subjects', label: 'Gestão de Matérias e Períodos', roles: ['secretary'] },
  { key: 'grades_entry', label: 'Lançamento de Notas', roles: ['teacher', 'secretary'] },
  { key: 'calendar', label: 'Calendário Acadêmico', roles: ['teacher', 'secretary'] },
  { key: 'documents', label: 'Gestão de Documentos', roles: ['teacher', 'secretary'] },
  { key: 'finance', label: 'Visão Geral Financeira', roles: ['secretary'] },
  { key: 'revenues', label: 'Gestão de Receitas', roles: ['secretary'] },
  { key: 'expenses', label: 'Gestão de Despesas', roles: ['secretary'] },
  { key: 'settings_school', label: 'Configurações da Escola', roles: ['secretary'] },
  { key: 'settings_contracts', label: 'Templates de Contrato', roles: ['secretary'] },
  { key: 'settings_profile', label: 'Configurações de Perfil', roles: ['teacher', 'secretary'] },
  { key: 'settings_security', label: 'Configurações de Segurança', roles: ['teacher', 'secretary'] },
];

// Estrutura do schema para as permissões
const permissionsSchema = z.object({
  teacher: z.record(z.boolean()).optional(),
  secretary: z.record(z.boolean()).optional(),
});

// Schema principal para o formulário
const rolePermissionsFormSchema = z.object({
  permissions: permissionsSchema.optional(),
});

type RolePermissionsFormData = z.infer<typeof rolePermissionsFormSchema>;

interface TenantConfig {
  permissions?: {
    teacher?: { [key: string]: boolean };
    secretary?: { [key: string]: boolean };
  };
  // Outras configurações existentes
  cnpj?: string | null;
  phone?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip_code?: string | null;
  logo_url?: string | null;
  pix_key?: string | null;
  bank_name?: string | null;
  bank_agency?: string | null;
  bank_account?: string | null;
  authorization_act?: string | null;
  minimum_passing_grade?: number | null;
}

interface Tenant {
  id: string;
  name: string;
  config: TenantConfig | null;
}

const fetchTenantConfig = async (tenantId: string): Promise<TenantConfig | null> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data.config;
};

const RolePermissionsForm: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const { data: tenantConfig, isLoading: isLoadingConfig } = useQuery<TenantConfig | null, Error>({
    queryKey: ['tenantConfig', tenantId],
    queryFn: () => fetchTenantConfig(tenantId!),
    enabled: !!tenantId,
  });

  const form = useForm<RolePermissionsFormData>({
    resolver: zodResolver(rolePermissionsFormSchema),
    defaultValues: {
      permissions: {
        teacher: {},
        secretary: {},
      },
    },
  });

  useEffect(() => {
    if (tenantConfig) {
      const defaultTeacherPermissions: { [key: string]: boolean } = {};
      const defaultSecretaryPermissions: { [key: string]: boolean } = {};

      features.forEach(feature => {
        if (feature.roles.includes('teacher')) {
          defaultTeacherPermissions[feature.key] = true; // Default to true
        }
        if (feature.roles.includes('secretary')) {
          defaultSecretaryPermissions[feature.key] = true; // Default to true
        }
      });

      form.reset({
        permissions: {
          teacher: { ...defaultTeacherPermissions, ...tenantConfig.permissions?.teacher },
          secretary: { ...defaultSecretaryPermissions, ...tenantConfig.permissions?.secretary },
        },
      });
    }
  }, [tenantConfig, form]);

  const mutation = useMutation({
    mutationFn: async (data: RolePermissionsFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");

      // Mesclar as novas permissões com as configurações existentes
      const updatedConfig: TenantConfig = {
        ...tenantConfig, // Mantém outras configurações
        permissions: {
          teacher: data.permissions?.teacher || {},
          secretary: data.permissions?.secretary || {},
        },
      };

      const { error } = await supabase
        .from('tenants')
        .update({ config: updatedConfig })
        .eq('id', tenantId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Permissões salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['tenantConfig', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Força a atualização do perfil para pegar as novas permissões
    },
    onError: (error) => {
      toast.error("Erro ao Salvar Permissões", { description: error.message });
    },
  });

  const onSubmit = (data: RolePermissionsFormData) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingConfig || isProfileLoading;

  const getPermissionValue = (role: 'teacher' | 'secretary', featureKey: string) => {
    return form.watch(`permissions.${role}.${featureKey}`);
  };

  const handlePermissionChange = (role: 'teacher' | 'secretary', featureKey: string, checked: boolean) => {
    form.setValue(`permissions.${role}.${featureKey}`, checked, { shouldDirty: true, shouldValidate: true });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Permissões de Acesso por Função
        </CardTitle>
        <CardDescription>
          Defina quais áreas do sistema cada função (Professor, Secretário) pode acessar.
          Administradores sempre têm acesso total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Como funciona?</AlertTitle>
            <AlertDescription className="text-sm">
              Marque as caixas para conceder acesso à funcionalidade correspondente.
              Se uma caixa estiver desmarcada, usuários com aquela função não verão o item no menu e não poderão acessar a página.
            </AlertDescription>
          </Alert>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-sm font-semibold text-muted-foreground">Funcionalidade</th>
                  <th className="p-3 text-center text-sm font-semibold text-muted-foreground">Professor</th>
                  <th className="p-3 text-center text-sm font-semibold text-muted-foreground">Secretário</th>
                </tr>
              </thead>
              <tbody>
                {features.map(feature => (
                  <tr key={feature.key} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{feature.label}</td>
                    <td className="p-3 text-center">
                      {feature.roles.includes('teacher') ? (
                        <Checkbox
                          checked={getPermissionValue('teacher', feature.key)}
                          onCheckedChange={(checked: boolean) => handlePermissionChange('teacher', feature.key, checked)}
                        />
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {feature.roles.includes('secretary') ? (
                        <Checkbox
                          checked={getPermissionValue('secretary', feature.key)}
                          onCheckedChange={(checked: boolean) => handlePermissionChange('secretary', feature.key, checked)}
                        />
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Permissões
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RolePermissionsForm;