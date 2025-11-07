import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, PlusCircle } from 'lucide-react';

// Define tipos para Class e Course (similar ao AddStudentSheet)
interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
  period: string;
  room: string | null;
  class_courses: {
    course_id: string;
    courses: { id: string; name: string } | null;
  }[];
}

const GenerateDemoStudents: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalToGenerate, setTotalToGenerate] = useState(0);

  // Fetch all classes for the current tenant
  const { data: allClasses, isLoading: isLoadingClasses, error: classesError } = useQuery<Class[], Error>({
    queryKey: ['allClassesForDemo', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          school_year,
          period,
          room,
          class_courses (
            course_id,
            courses (id, name)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw new Error(error.message);
      return data as unknown as Class[];
    },
    enabled: !!tenantId && isAdmin,
  });

  // Mutation to call the Edge Function
  const createStudentMutation = useMutation({
    mutationFn: async (payload: any) => { // Payload will be the structure expected by create-student-and-guardian
      const { error } = await supabase.functions.invoke('create-student-and-guardian', {
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setGeneratedCount(prev => prev + 1);
    },
    onError: (error) => {
      toast.error("Erro ao criar aluno demo", { description: error.message });
    },
  });

  // Helper functions for generating random data
  const generateRandomString = (length: number) => Math.random().toString(36).substring(2, 2 + length);
  const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const generateRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
  const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const firstNames = ["João", "Maria", "Pedro", "Ana", "Carlos", "Sofia", "Lucas", "Laura", "Gabriel", "Isabela", "Matheus", "Julia", "Rafael", "Manuela", "Daniel", "Helena", "Enzo", "Alice", "Bruno", "Valentina"];
  const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Almeida", "Ferreira", "Rodrigues", "Gomes", "Martins", "Lima", "Carvalho", "Ribeiro", "Fernandes", "Dias", "Mendes", "Nunes", "Rocha", "Barbosa"];
  const relationships = ['Pai', 'Mãe', 'Avô(ó)', 'Tutor'];
  const genders = ['Masculino', 'Feminino'];
  const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const cities = ["Salvador", "Rio de Janeiro", "São Paulo", "Belo Horizonte", "Porto Alegre", "Recife", "Fortaleza", "Curitiba", "Brasília", "Manaus", "Belém", "Goiânia", "Vitória", "Florianópolis", "Natal", "João Pessoa", "Maceió", "Campo Grande", "Cuiabá", "Teresina"];

  const handleGenerateDemoStudents = async () => {
    if (!tenantId || !allClasses || allClasses.length === 0) {
      toast.error("Erro", { description: "Nenhuma turma encontrada para gerar alunos de demonstração." });
      return;
    }

    setIsGenerating(true);
    setGeneratedCount(0);
    const numStudentsPerClass = 10;
    setTotalToGenerate(allClasses.length * numStudentsPerClass);

    try {
      for (const classItem of allClasses) {
        const classId = classItem.id;
        const schoolYear = classItem.school_year;
        // Para fins de demonstração, pegamos o primeiro curso associado à turma
        const courseId = classItem.class_courses[0]?.courses?.id || null; 

        for (let i = 0; i < numStudentsPerClass; i++) {
          const studentFirstName = getRandomElement(firstNames);
          const studentLastName = getRandomElement(lastNames);
          const guardianFirstName = getRandomElement(firstNames);
          const guardianLastName = getRandomElement(lastNames);
          const randomCity = getRandomElement(cities);
          const randomState = getRandomElement(states);

          const studentData = {
            full_name: `${studentFirstName} ${studentLastName} (Demo ${i + 1})`,
            birth_date: generateRandomDate(new Date(2010, 0, 1), new Date(2019, 11, 31)), // Students born between 2010-2019
            phone: `719${generateRandomNumber(10000000, 99999999)}`,
            email: `${studentFirstName.toLowerCase()}.${studentLastName.toLowerCase()}${i}@demo.com`,
            class_id: classId,
            course_id: courseId, // Passando o course_id
            gender: getRandomElement(genders),
            nationality: "Brasileira",
            naturality: randomCity,
            cpf: `${generateRandomNumber(100, 999)}.${generateRandomNumber(100, 999)}.${generateRandomNumber(100, 999)}-${generateRandomNumber(10, 99)}`,
            rg: `${generateRandomNumber(1000000, 9999999)}`,
            zip_code: `40${generateRandomNumber(1000000, 9999999)}`,
            address_street: `Rua Demo ${generateRandomString(5)}`,
            address_number: String(generateRandomNumber(1, 500)),
            address_neighborhood: `Bairro Demo ${generateRandomString(4)}`,
            address_city: randomCity,
            address_state: randomState,
            special_needs: i % 5 === 0 ? "Dislexia leve" : null,
            medication_use: i % 7 === 0 ? "Ritalina (TDAH)" : null,
          };

          const guardianData = {
            guardian_full_name: `${guardianFirstName} ${guardianLastName} (Resp.)`,
            guardian_relationship: getRandomElement(relationships),
            guardian_phone: `719${generateRandomNumber(10000000, 99999999)}`,
            guardian_email: `${guardianFirstName.toLowerCase()}.${guardianLastName.toLowerCase()}@resp.com`,
            guardian_cpf: `${generateRandomNumber(100, 999)}.${generateRandomNumber(100, 999)}.${generateRandomNumber(100, 999)}-${generateRandomNumber(10, 99)}`,
          };

          const payload = {
            tenant_id: tenantId,
            school_year: schoolYear,
            student: studentData,
            guardian: guardianData,
          };

          await createStudentMutation.mutateAsync(payload);
        }
      }
      toast.success("Alunos de demonstração criados!", {
        description: `${generatedCount} alunos foram adicionados com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['students', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', tenantId] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Falha na Geração de Alunos Demo", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isProfileLoading || isLoadingClasses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerar Alunos de Demonstração
          </CardTitle>
          <CardDescription>
            <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> Carregando dados...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (classesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerar Alunos de Demonstração
          </CardTitle>
          <CardDescription className="text-destructive">
            Erro ao carregar turmas: {classesError.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return null; // Only render for admins
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gerar Alunos de Demonstração
        </CardTitle>
        <CardDescription>
          Crie 10 alunos de demonstração para cada turma e série/ano existente no sistema.
          Isso ajudará a popular o sistema para testes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allClasses && allClasses.length === 0 ? (
          <p className="text-muted-foreground text-sm mb-4">
            Nenhuma turma encontrada. Crie turmas e associe-as a séries/anos primeiro para gerar alunos de demonstração.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm mb-4">
            Serão gerados {allClasses?.length * 10 || 0} alunos de demonstração.
          </p>
        )}
        <Button
          onClick={handleGenerateDemoStudents}
          disabled={isGenerating || !allClasses || allClasses.length === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando Alunos ({generatedCount}/{totalToGenerate})...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Gerar Alunos Demo
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GenerateDemoStudents;