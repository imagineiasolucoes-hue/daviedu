import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, School, BookOpen, Users, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Class {
  id: string;
  name: string;
  school_year: number;
  period: string;
  room: string | null; // Adicionado: A propriedade 'room' estava faltando na interface
  // Relação N:M para cursos
  class_courses: {
    courses: { name: string } | null;
  }[];
  // Contagem de alunos (será buscada separadamente ou mockada)
  student_count?: number;
}

interface TeacherClassLink {
  class_id: string;
  period: string;
  classes: Class | null;
}

const fetchMyClasses = async (employeeId: string): Promise<Class[]> => {
  console.log("Fetching classes for employeeId:", employeeId); // Log de depuração
  const { data, error } = await supabase
    .from('teacher_classes')
    .select(`
      class_id,
      period,
      classes (
        id, 
        name, 
        school_year, 
        room, 
        class_courses (
          courses (name)
        )
      )
    `)
    .eq('employee_id', employeeId)
    .order('classes(school_year)', { ascending: false });

  if (error) throw new Error(error.message);
  
  const rawData: TeacherClassLink[] = data as unknown as TeacherClassLink[];
  console.log("Raw teacher_classes data:", rawData); // Log de depuração
  
  // Mapeia para retornar apenas os objetos Class, adicionando o período de ensino
  const classes = rawData
    .map(tc => {
      if (tc.classes) {
        return {
          ...tc.classes,
          period: tc.period, // Usamos o período da atribuição do professor
          student_count: Math.floor(Math.random() * 30) + 10, // Mock de contagem de alunos
        };
      }
      return null;
    })
    .filter(Boolean) as Class[];

  console.log("Processed classes for display:", classes); // Log de depuração
  return classes;
};

const MyClassesPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isTeacher } = useProfile();
  const employeeId = profile?.employee_id;

  const { data: classes, isLoading: isClassesLoading, error } = useQuery<Class[], Error>({
    queryKey: ['myClasses', employeeId],
    queryFn: () => fetchMyClasses(employeeId!),
    enabled: !!employeeId && isTeacher,
  });

  if (isProfileLoading || isClassesLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar suas turmas: {error.message}</div>;
  }

  if (!isTeacher) {
    return <div className="text-destructive">Acesso negado.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <School className="h-8 w-8 text-primary" />
          Minhas Turmas
        </h1>
        <Button asChild variant="outline">
            <Link to="/teacher/grade-entry">
                <ClipboardList className="mr-2 h-4 w-4" />
                Lançar Notas
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Turmas Atribuídas ({classes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Série/Ano</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead className="text-right">Alunos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {classItem.class_courses.map((cc, index) => (
                          cc.courses?.name ? (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cc.courses.name}
                            </Badge>
                          ) : null
                        ))}
                        {classItem.class_courses.length === 0 && 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{classItem.school_year}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{classItem.period}</Badge>
                    </TableCell>
                    <TableCell>{classItem.room || 'N/A'}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {classItem.student_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {classes?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <p>Nenhuma turma atribuída a você.</p>
              <p className="text-sm">
                Para que as turmas apareçam aqui, um administrador ou secretário da escola precisa atribuí-las ao seu perfil de professor.
                Por favor, entre em contato com a secretaria para realizar essa configuração.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyClassesPage;