import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Classes from "./secretaria/Classes";
import Students from "./secretaria/Students";
import usePageTitle from "@/hooks/usePageTitle";

const Secretaria = () => {
  usePageTitle("Secretaria");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Secretaria</h1>
      <p className="text-muted-foreground mt-2">
        Gerencie alunos, turmas e matrículas.
      </p>
      
      <Tabs defaultValue="students">
        <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-6">
          <Students />
        </TabsContent>
        
        <TabsContent value="classes" className="mt-6">
          <Classes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Secretaria;