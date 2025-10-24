import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SchoolInfoForm from "@/components/settings/SchoolInfoForm";
import TeachersManagement from "@/components/settings/TeachersManagement";

const Settings = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      <Tabs defaultValue="school">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="school">Informações da Escola</TabsTrigger>
          <TabsTrigger value="teachers">Professores</TabsTrigger>
        </TabsList>
        <TabsContent value="school" className="mt-6">
          <SchoolInfoForm />
        </TabsContent>
        <TabsContent value="teachers" className="mt-6">
          <TeachersManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;