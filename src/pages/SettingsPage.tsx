import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, School, Lock, FileText, Loader2 } from 'lucide-react';
import SchoolSettingsForm from '@/components/settings/SchoolSettingsForm';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import SecuritySettingsForm from '@/components/settings/SecuritySettingsForm';
import ContractTemplateForm from '@/components/settings/ContractTemplateForm';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { profile, isLoading, isAdmin, isSuperAdmin, isSecretary, isTeacher } = useProfile(); // Added isTeacher

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Permitir que Admin, Super Admin, Secretário E Professor acessem a página de configurações.
  // Se um usuário não for nenhum desses perfis, ele será redirecionado.
  // Isso garante que estudantes não possam acessar as configurações.
  if (!isAdmin && !isSuperAdmin && !isSecretary && !isTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  // Determinar a aba padrão com base no perfil
  // Se for professor, o padrão é 'profile'. Caso contrário (Admin/Secretary/SuperAdmin), o padrão é 'school'.
  const defaultTab = (isTeacher) ? "profile" : "school";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Separator />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap justify-start gap-2"> {/* Ajustado para flex-wrap e gap para melhor responsividade */}
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          {(isAdmin || isSuperAdmin || isSecretary) && ( // Mostrar configurações da escola apenas para esses perfis
            <TabsTrigger value="school">
              <School className="h-4 w-4 mr-2" />
              Escola
            </TabsTrigger>
          )}
          {(isAdmin || isSecretary) && ( // Mostrar contratos apenas para Admin/Secretary
            <TabsTrigger value="contracts">
              <FileText className="h-4 w-4 mr-2" />
              Contratos
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
        {(isAdmin || isSuperAdmin || isSecretary) && (
          <TabsContent value="school">
            <SchoolSettingsForm />
          </TabsContent>
        )}
        {(isAdmin || isSecretary) && (
          <TabsContent value="contracts">
            <ContractTemplateForm />
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