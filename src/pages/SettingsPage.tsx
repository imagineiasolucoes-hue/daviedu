import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, School, Lock } from 'lucide-react';
import SchoolSettingsForm from '@/components/settings/SchoolSettingsForm';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';

const SecuritySettings: React.FC = () => (
  <Card>
    <CardContent className="space-y-4 pt-6">
      <h3 className="text-lg font-semibold">Segurança e Acesso</h3>
      <p className="text-muted-foreground">Altere sua senha e gerencie a autenticação.</p>
      <div className="h-24 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center text-sm text-muted-foreground border border-dashed">
        Formulário de Alteração de Senha
      </div>
    </CardContent>
  </Card>
);

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <Separator />

      <Tabs defaultValue="profile" className="w-full">
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
          <ProfileSettingsForm />
        </TabsContent>
        <TabsContent value="school">
          <SchoolSettingsForm />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;