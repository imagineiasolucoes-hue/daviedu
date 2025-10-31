import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, School, Lock } from 'lucide-react';
import SchoolSettingsForm from '@/components/settings/SchoolSettingsForm';

// Componentes Placeholder para as abas
const ProfileSettings: React.FC = () => (
  <CardContent className="space-y-4">
    <h3 className="text-lg font-semibold">Configurações de Perfil</h3>
    <p className="text-muted-foreground">Gerencie suas informações pessoais e avatar.</p>
    {/* Conteúdo do formulário de perfil virá aqui */}
    <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center text-sm text-muted-foreground border border-dashed">
      Formulário de Perfil (Nome, Email, Avatar)
    </div>
  </CardContent>
);

const SecuritySettings: React.FC = () => (
  <CardContent className="space-y-4">
    <h3 className="text-lg font-semibold">Segurança e Acesso</h3>
    <p className="text-muted-foreground">Altere sua senha e gerencie a autenticação.</p>
    {/* Conteúdo de segurança virá aqui */}
    <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center text-sm text-muted-foreground border border-dashed">
      Formulário de Alteração de Senha
    </div>
  </CardContent>
);


const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Separator />

      <Tabs defaultValue="school" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:flex">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="school">
            <School className="h-4 w-4 mr-2" />
            Escola
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <ProfileSettings />
          </Card>
        </TabsContent>
        <TabsContent value="school">
          <SchoolSettingsForm />
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <SecuritySettings />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;