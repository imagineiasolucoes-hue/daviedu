import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ClipboardList, GraduationCap, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// --- Tipos de Dados ---
interface Course {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
  // Agora, os cursos são uma lista de associações
  class_courses: {
    course_id: string;
    courses: { name: string } | null;
  }[];
}

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
}

// Interface para o item bruto retornado pela consulta `teacher_classes`
interface SupabaseTeacherClassRawItem {
  class_id: string;
  period: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  classes: Class | null; // Alterado para ser um único objeto Class
}

interface Subject {
  id: string;
  name: string;
}

interface AssessmentType {
  id: string;
  name: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
}

// --- Schemas de Validação ---
const gradeEntrySchema = z.object({
  courseId: z.string().uuid("Selecione uma série/ano.").optional().nullable(), // Agora é obrigatório se a turma tiver cursos
  classId: z.string().uuid("Selecione uma turma."),
  subjectName: z.string().min(1, "Selecione uma matéria."),
  assessmentType: z.string().optional().nullable(), 
  period: z.string().min(1, "Selecione o período da avaliação."), 
  grades: z.array(z.object({
    studentId: z.string().uuid(),
    gradeValue: z.coerce.number().min(0, "A nota deve ser 0 ou maior.").max(10, "A nota máxima é 10.").optional().nullable(),
  })).min(1, "Nenhum aluno para lançar notas."),
});

type GradeEntryFormData = z.infer<typeof gradeEntrySchema>;

// --- Funções de Busca de Dados ---

const fetchClassesForGradeEntry = async (tenantId: string, employeeId: string | undefined, isTeacher: boolean, isAdmin: boolean): Promise<Class[]> => {
  if (isAdmin) {
    // Admin vê todas as turmas e seus cursos associados
    const { data, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        school_year,
        class_courses (
          course_id,
          courses (id, name)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('name');
    if (error) throw new Error(error.message);
    return data as unknown as Class[];
  } else if (isTeacher && employeeId) {
    // Professor vê apenas as turmas atribuídas e seus cursos associados
    const { data, error } = await supabase
      .from('teacher_classes')
      .select(`
        class_id,
        period,
        classes (
          id,
          name,
          school_year,
          class_courses (
            course_id,
            courses (id, name)
          )
        )
      `)
      .eq('employee_id', employeeId);

    if (error) throw new Error(error.message);
    
    const rawTeacherClasses: SupabaseTeacherClassRawItem[] = data as unknown as SupabaseTeacherClassRawItem[];

    // Mapeia para retornar apenas os objetos Class
    return rawTeacherClasses.map(tc => tc.classes).filter(Boolean) as Class[];
  }
  return [];
};

const fetchStudentsByClass = async (classId: string, tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('class_id', classId)
    .eq('tenant_id', tenantId)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchSubjects = async (tenantId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchAssessmentTypes = async (tenantId: string): Promise<AssessmentType[]> => {
  const { data, error } = await supabase
    .from('assessment_types')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchAcademicPeriods = async (tenantId: string): Promise<AcademicPeriod[]> => {
  const { data, error } = await supabase
    .from('academic_periods')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const GradeEntryPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isTeacher, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const employeeId = profile?.id; 

  const form = useForm<GradeEntryFormData>({
    resolver: zodResolver(gradeEntrySchema),
    defaultValues: {
      courseId: undefined, // Deve ser undefined/null inicialmente
      classId: '',
      subjectName: '',
      assessmentType: null, 
      period: '',
      grades: [],
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedCourseId = form.watch('courseId');

  const { data: allClassesForEntry, isLoading: isLoadingClassesForEntry } = useQuery<Class[], Error>({
    queryKey: ['classesForGradeEntry', tenantId, employeeId, isTeacher, isAdmin],
    queryFn: () => fetchClassesForGradeEntry(tenantId!, employeeId, isTeacher, isAdmin),
    enabled: !!tenantId && (isTeacher || isAdmin),
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[], Error>({
    queryKey: ['studentsInClass', selectedClassId, tenantId],
    queryFn: () => fetchStudentsByClass(selectedClassId, tenantId!),
    enabled: !!selectedClassId && !!tenantId,
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[], Error>({
    queryKey: ['subjects', tenantId],
    queryFn: () => fetchSubjects(tenantId!),
    enabled: !!tenantId,
  });

  const { data: assessmentTypes, isLoading: isLoadingAssessmentTypes } = useQuery<AssessmentType[], Error>({
    queryKey: ['assessmentTypes', tenantId],
    queryFn: () => fetchAssessmentTypes(tenantId!),
    enabled: !!tenantId,
  });

  const { data: academicPeriods, isLoading: isLoadingAcademicPeriods } = useQuery<AcademicPeriod[], Error>({
    queryKey: ['academicPeriods', tenantId],
    queryFn: () => fetchAcademicPeriods(tenantId!),
    enabled: !!tenantId,
  });

  // --- Lógica de Cursos Disponíveis ---
  const selectedClass = useMemo(() => {
    return allClassesForEntry?.find(c => c.id === selectedClassId);
  }, [allClassesForEntry, selectedClassId]);

  const availableCoursesInClass = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.class_courses
      .map(cc => ({
        id: cc.course_id,
        name: cc.courses?.name || 'Curso Desconhecido',
      }))
      .filter(c => c.id);
  }, [selectedClass]);

  // Efeito para resetar o courseId se a turma mudar ou se o curso selecionado não estiver mais disponível
  useEffect(() => {
    if (selectedClassId) {
      // Se a turma mudar, resetamos o curso
      form.setValue('courseId', undefined, { shouldValidate: true });
    }
  }, [selectedClassId, form]);


  // Efeito para inicializar as notas quando os alunos carregam
  useEffect(() => {
    if (students) {
      form.setValue('grades', students.map(s => ({ studentId: s.id, gradeValue: null })));
    } else {
      form.setValue('grades', []);
    }
  }, [students, form]);

  const onSubmit = async (data: GradeEntryFormData) => {
    if (!tenantId || !employeeId) { 
      toast.error("Erro", { description: "Dados do usuário ou da escola ausentes." });
      return;
    }

    if (!selectedClass) {
      toast.error("Erro", { description: "Turma selecionada inválida." });
      return;
    }

    // O courseId agora é obrigatório se a turma tiver cursos associados
    if (availableCoursesInClass.length > 0 && !data.courseId) {
        toast.error("Erro", { description: "Selecione a Série/Ano para a qual as notas se aplicam." });
        return;
    }

    const gradesToInsert = data.grades
      .filter(g => g.gradeValue !== null && g.gradeValue !== undefined) 
      .map(g => ({
        tenant_id: tenantId,
        student_id: g.studentId,
        class_id: data.classId,
        course_id: data.courseId, // Usando o courseId selecionado
        subject_name: data.subjectName,
        grade_value: g.gradeValue,
        assessment_type: data.assessmentType || null, 
        period: data.period,
        teacher_id: employeeId, 
        date_recorded: new Date().toISOString().split('T')[0], 
      }));

    if (gradesToInsert.length === 0) {
      toast.warning("Nenhuma nota para salvar", { description: "Preencha pelo menos uma nota para submeter." });
      return;
    }

    try {
      const { error } = await supabase
        .from('grades')
        .insert(gradesToInsert);

      if (error) throw new Error(error.message);

      toast.success("Notas lançadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['studentGrades'] }); 
      
      // Resetar apenas as notas, mantendo as seleções de contexto
      form.reset({
        courseId: data.courseId,
        classId: data.classId, 
        subjectName: data.subjectName,
        assessmentType: null, 
        period: data.period,
        grades: students?.map(s => ({ studentId: s.id, gradeValue: null })) || [], 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      console.error("Error submitting grades:", error); // Adicionando console.error para depuração
      toast.error("Erro ao Lançar Notas", {
        description: errorMessage,
      });
    }
  };

  const isLoading = isProfileLoading || isLoadingClassesForEntry || isLoadingStudents || isLoadingSubjects || isLoadingAssessmentTypes || isLoadingAcademicPeriods;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          Lançamento de Notas
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Você não tem permissão para acessar esta página. Apenas professores e administradores podem lançar notas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <ClipboardList className="h-8 w-8 text-primary" />
        Lançamento de Notas
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Registrar Notas de Avaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção de Turma, Série/Ano, Matéria, Tipo e Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CAMPO 1: Turma */}
              <div className="space-y-2">
                <Label htmlFor="classId">Turma</Label>
                <Select 
                  onValueChange={(value) => {
                    form.setValue('classId', value);
                  }} 
                  value={form.watch('classId') || 'none'}
                  disabled={isLoadingClassesForEntry || allClassesForEntry?.length === 0}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder={isLoadingClassesForEntry ? "Carregando turmas..." : "Selecione a turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma Turma</SelectItem>
                    {allClassesForEntry?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.school_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classId && <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>}
                {(!allClassesForEntry || allClassesForEntry.length === 0) && !isLoadingClassesForEntry && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Nenhuma turma atribuída a você ou cadastrada para a escola.
                  </p>
                )}
              </div>

              {/* CAMPO 2: Série / Ano (Condicional) */}
              <div className="space-y-2">
                <Label htmlFor="courseId">Série / Ano</Label>
                <Select 
                  onValueChange={(value) => form.setValue('courseId', value)} 
                  value={form.watch('courseId') || 'none'}
                  disabled={!selectedClassId || availableCoursesInClass.length === 0}
                >
                  <SelectTrigger id="courseId">
                    <SelectValue placeholder={!selectedClassId ? "Selecione uma turma" : (availableCoursesInClass.length === 0 ? "Nenhum curso associado" : "Selecione a série/ano")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCoursesInClass.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseId && <p className="text-sm text-destructive">{form.formState.errors.courseId.message}</p>}
                {selectedClassId && availableCoursesInClass.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Esta turma não tem séries/anos associados.
                  </p>
                )}
              </div>

              {/* CAMPO 3: Matéria */}
              <div className="space-y-2">
                <Label htmlFor="subjectName">Matéria</Label>
                <Select 
                  onValueChange={(value) => form.setValue('subjectName', value)} 
                  value={form.watch('subjectName')}
                  disabled={!selectedClassId || isLoadingSubjects || (subjects && subjects.length === 0)}
                >
                  <SelectTrigger id="subjectName">
                    <SelectValue placeholder={isLoadingSubjects ? "Carregando matérias..." : "Selecione a matéria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map(subject => (
                      <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.subjectName && <p className="text-sm text-destructive">{form.formState.errors.subjectName.message}</p>}
              </div>

              {/* CAMPO 4: Período */}
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select 
                  onValueChange={(value) => form.setValue('period', value)} 
                  value={form.watch('period')}
                  disabled={isLoadingAcademicPeriods || (academicPeriods && academicPeriods.length === 0)}
                >
                  <SelectTrigger id="period">
                    <SelectValue placeholder={isLoadingAcademicPeriods ? "Carregando períodos..." : "Selecione o período"} />
                  </SelectTrigger>
                  <SelectContent>
                    {academicPeriods?.map(period => (
                      <SelectItem key={period.id} value={period.name}>{period.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.period && <p className="text-sm text-destructive">{form.formState.errors.period.message}</p>}
              </div>

              {/* CAMPO 5: Tipo de Avaliação */}
              <div className="space-y-2">
                <Label htmlFor="assessmentType">Tipo de Avaliação (Opcional)</Label>
                <Select 
                  onValueChange={(value) => form.setValue('assessmentType', value === "none" ? null : value)} 
                  value={form.watch('assessmentType') || 'none'}
                  disabled={!selectedClassId || isLoadingAssessmentTypes || (assessmentTypes && assessmentTypes.length === 0)}
                >
                  <SelectTrigger id="assessmentType">
                    <SelectValue placeholder={isLoadingAssessmentTypes ? "Carregando tipos..." : "Selecione o tipo"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {assessmentTypes?.map(type => (
                      <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.assessmentType && <p className="text-sm text-destructive">{form.formState.errors.assessmentType.message}</p>}
              </div>
            </div>

            <Separator />

            {/* Tabela de Alunos e Notas */}
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Alunos da Turma {selectedClass ? `(${selectedClass.name})` : ''}
            </h3>
            {selectedClassId && students && students.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Aluno</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead className="w-[120px] text-right">Nota (0-10)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.registration_code}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            placeholder="N/A"
                            {...form.register(`grades.${index}.gradeValue`, { valueAsNumber: true })}
                            className="w-24 text-right"
                          />
                          {form.formState.errors.grades?.[index]?.gradeValue && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.grades[index]?.gradeValue?.message}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                {selectedClassId ? "Nenhum aluno encontrado nesta turma." : "Selecione uma turma para ver os alunos."}
              </p>
            )}
            {form.formState.errors.grades && <p className="text-sm text-destructive mt-2">{form.formState.errors.grades.message}</p>}

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={form.formState.isSubmitting || !selectedClassId || !form.watch('subjectName') || !form.watch('period') || (availableCoursesInClass.length > 0 && !selectedCourseId)}
            >
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Notas
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeEntryPage;