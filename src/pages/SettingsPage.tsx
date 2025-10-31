import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, School, Lock } from 'lucide-react';
import SchoolSettingsForm from '@/components/settings/SchoolSettingsForm';
import ProfileSettingsForm from '@/components/settings/ProfileSettingsForm';
import SecuritySettingsForm from '@/components/settings/SecuritySettingsForm';

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
          <SecuritySettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;