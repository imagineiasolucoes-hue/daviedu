import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Courses from "./secretaria/Courses";
import Classes from "./secretaria/Classes";

const Secretaria = () => {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Secretaria</h1>
      <p className="text-muted-foreground mt-2">
        Gerencie alunos, turmas, cursos e matrículas.
      </p>
      
      <Tabs defaultValue="classes">
        <TabsList className="grid w-full grid-cols-3 md:w-[450px]">
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-6">
          <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold">Gestão de Alunos</h3>
            <p className="text-muted-foreground">Funcionalidade de gestão de alunos em desenvolvimento.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="classes" className="mt-6">
          <Classes />
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          <Courses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Secretaria;