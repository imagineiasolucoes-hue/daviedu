import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, School, Lock, FileText, Loader2, ShieldCheck } from 'lucide-react'; // Adicionado ShieldCheck
import SchoolSettingsForm from '@/components/settings/SchoolSettingsForm';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import SecuritySettingsForm from '@/components/settings/SecuritySettingsForm';
import ContractTemplateForm from '@/components/settings/ContractTemplateForm';
import RolePermissionsForm from '@/components/settings/RolePermissionsForm'; // NOVO IMPORT
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { profile, isLoading, isAdmin, isSuperAdmin, isSecretary } = useProfile();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Apenas Admin, Super Admin e Secretary podem acessar as configurações da escola e contratos
  if (!isAdmin && !isSuperAdmin && !isSecretary) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Separator />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:w-auto md:flex"> {/* Aumentado para 5 colunas */}
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="school">
            <School className="h-4 w-4 mr-2" />
            Escola
          </TabsTrigger>
          <TabsTrigger value="contracts">
            <FileText className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
          {/* NOVA ABA DE PERMISSÕES */}
          {(isAdmin || isSuperAdmin) && ( // Apenas Admin e Super Admin podem ver/editar permissões
            <TabsTrigger value="permissions">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Permissões
            </TabsTrigger>
          )}
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettingsForm />
        </TabsContent>
        <TabsContent value="school">
          <SchoolSettingsForm />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractTemplateForm />
        </TabsContent>
        {/* NOVO CONTEÚDO DA ABA DE PERMISSÕES */}
        {(isAdmin || isSuperAdmin) && (
          <TabsContent value="permissions">
            <RolePermissionsForm />
          </TabsContent>
        )}
        <TabsContent value="security">
          <SecuritySettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;