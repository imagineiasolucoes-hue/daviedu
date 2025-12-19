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
import { Link } from 'react-router-dom';

// --- Tipos de Dados ---
interface Course {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
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

// Representa uma turma com seus cursos associados
interface ClassWithCourses {
  id: string;
  name: string;
  school_year: number;
  class_courses: {
    course_id: string;
    courses: { id: string; name: string } | null;
  }[];
}

// Tipo para o resultado da query teacher_classes
interface TeacherAssignmentResult {
  class_id: string;
  classes: ClassWithCourses | null; // Corrigido para ser um objeto ClassWithCourses ou null
}

// --- Schemas de Validação ---
const gradeEntrySchema = z.object({
  courseId: z.string().uuid("Selecione uma Série/Ano.").optional().nullable(),
  classId: z.string().uuid("Selecione uma turma.").nullable(),
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

const fetchClassesForGradeEntry = async (tenantId: string, employeeId: string | undefined, isTeacher: boolean): Promise<ClassWithCourses[]> => {
  if (isTeacher && employeeId) {
    // Professor: Busca as turmas através das atribuições (teacher_classes)
    const { data: assignments, error: assignmentError } = await supabase
      .from('teacher_classes')
      .select(`
        class_id,
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

    if (assignmentError) throw new Error(assignmentError.message);

    // O Supabase retorna 'classes' como um objeto aninhado (ClassWithCourses | null)
    const rawAssignments: TeacherAssignmentResult[] = assignments as unknown as TeacherAssignmentResult[];

    // Filtra e mapeia para obter apenas as turmas únicas
    const uniqueClassesMap = new Map<string, ClassWithCourses>();
    rawAssignments.forEach(a => {
      if (a.classes && !uniqueClassesMap.has(a.classes.id)) {
        uniqueClassesMap.set(a.classes.id, a.classes);
      }
    });
    return Array.from(uniqueClassesMap.values());

  } else {
    // Admin/Secretary: Vê todas as turmas
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
    return data as unknown as ClassWithCourses[];
  }
};

const fetchStudentsByClass = async (classId: string, tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('class_id', classId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active') // Apenas alunos ativos
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
  const { profile, isLoading: isProfileLoading, isTeacher, isAdmin, isSecretary } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const teacherEmployeeId = profile?.employee_id; 

  // --- Form Setup ---
  const form = useForm<GradeEntryFormData>({
    resolver: zodResolver(gradeEntrySchema),
    defaultValues: {
      courseId: null,
      classId: null,
      subjectName: '',
      assessmentType: null, 
      period: '',
      grades: [],
    },
  });

  const selectedClassId = form.watch('classId');
  const selectedCourseId = form.watch('courseId');
  const selectedSubjectName = form.watch('subjectName');
  const selectedPeriod = form.watch('period');

  // --- Data Fetching ---
  const { data: allClassesForEntry, isLoading: isLoadingClassesForEntry } = useQuery<ClassWithCourses[], Error>({
    queryKey: ['classesForGradeEntry', tenantId, teacherEmployeeId, isTeacher, isAdmin],
    queryFn: () => fetchClassesForGradeEntry(tenantId!, teacherEmployeeId, isTeacher),
    enabled: !!tenantId && (isTeacher || isAdmin || isSecretary),
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[], Error>({
    queryKey: ['studentsInClass', selectedClassId, tenantId],
    queryFn: () => fetchStudentsByClass(selectedClassId!, tenantId!),
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

  // --- Memoized Data Filtering ---
  
  // 1. Detalhes da Turma Selecionada
  const selectedClassDetails = useMemo(() => {
    return allClassesForEntry?.find(c => c.id === selectedClassId) || null;
  }, [allClassesForEntry, selectedClassId]);

  // 2. Available Courses (filtered by selected class)
  const availableCoursesInClass = useMemo(() => {
    if (!selectedClassDetails) return [];
    
    return selectedClassDetails.class_courses
      .map(cc => cc.courses)
      .filter(c => c !== null) as Course[];
  }, [selectedClassDetails]);

  // Determine if course selection is required
  const isCourseSelectionRequired = !!selectedClassId && availableCoursesInClass.length > 0;
  
  // Determine if the form is ready to submit (all critical fields selected)
  const isFormReady = !!selectedClassId && 
                      !!selectedSubjectName && 
                      !!selectedPeriod &&
                      (isCourseSelectionRequired ? !!selectedCourseId : true) && 
                      (students?.length ?? 0) > 0;

  // --- Effects for Form Synchronization ---
  
  // Reset courseId and period when class changes
  useEffect(() => {
    // Se a turma mudar, e a nova turma exigir seleção de curso, resetamos o curso.
    // Se a nova turma não exigir curso, garantimos que courseId seja null.
    if (selectedClassId) {
        const requiresCourse = availableCoursesInClass.length > 0;
        form.setValue('courseId', requiresCourse ? null : 'none', { shouldValidate: true });
        form.setValue('period', '', { shouldValidate: true });
    }
  }, [selectedClassId, form, availableCoursesInClass.length]);

  // Sync students list with grades array
  useEffect(() => {
    if (students) {
      const newGrades = students.map(s => ({ studentId: s.id, gradeValue: null }));
      form.setValue('grades', newGrades);
    } else {
      form.setValue('grades', []);
    }
  }, [students, form]);
  
  // --- Submission Logic ---
  const onSubmit = async (data: GradeEntryFormData) => {
    // CRITICAL VALIDATION 1: Permissions
    // Agora, professores, administradores e secretários podem lançar notas.
    if (!tenantId || (!teacherEmployeeId && !isAdmin && !isSecretary)) { 
      toast.error("Erro de Permissão", { description: "Seu perfil não tem permissão para lançar notas." });
      return;
    }
    
    // Se for Admin/Secretary, o teacherEmployeeId será null, mas a inserção no DB
    // exige um teacher_id. Para Admin/Secretary, usaremos o employee_id do Admin/Secretary
    // se ele existir, ou um placeholder se necessário.
    // Vamos garantir que o teacher_id seja o employee_id do usuário logado, se existir.
    const currentEmployeeId = profile?.employee_id;
    if (!currentEmployeeId) {
        toast.error("Erro de Perfil", { description: "Seu perfil não está vinculado a um registro de funcionário (employee_id) para lançar notas." });
        return;
    }


    // CRITICAL VALIDATION 2: Conditional Course Selection
    if (isCourseSelectionRequired && !data.courseId) {
        toast.error("Erro de Validação", { description: "Selecione a Série/Ano para a qual as notas se aplicam." });
        return;
    }
    
    // Ensure courseId is null if not required (for DB consistency)
    const finalCourseId = isCourseSelectionRequired && data.courseId !== 'none' ? data.courseId : null;

    // CRITICAL VALIDATION 3: Grades to Insert
    const gradesToInsert = data.grades
      .filter(g => g.gradeValue !== null && g.gradeValue !== undefined) 
      .map(g => ({
        tenant_id: tenantId,
        student_id: g.studentId,
        class_id: data.classId,
        course_id: finalCourseId, // Use the conditionally determined course ID
        subject_name: data.subjectName,
        grade_value: g.gradeValue,
        assessment_type: data.assessmentType || null, 
        period: data.period, // Academic Period Name (e.g., "1º Bimestre")
        teacher_id: currentEmployeeId, // Usando o employee_id do usuário logado
        date_recorded: new Date().toISOString().split('T')[0], 
      }));

    if (gradesToInsert.length === 0) {
      toast.warning("Nenhuma nota para salvar", { description: "Preencha pelo menos uma nota para submeter." });
      return;
    }

    // CRITICAL FUNCTION: Database Insertion
    try {
      const { error } = await supabase
        .from('grades')
        .insert(gradesToInsert);

      if (error) throw new Error(error.message);

      toast.success("Notas lançadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['studentGrades'] }); 
      
      // Reset form state, keeping the current selection context
      form.reset({
        courseId: data.courseId,
        classId: data.classId, 
        subjectName: data.subjectName,
        assessmentType: null, // Reset assessment type
        period: data.period,
        grades: students?.map(s => ({ studentId: s.id, gradeValue: null })) || [], 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      console.error("Error submitting grades:", error);
      toast.error("Erro ao Lançar Notas", {
        description: errorMessage,
      });
    }
  };

  // --- Loading and Permission Checks ---
  const isLoading = isProfileLoading || isLoadingClassesForEntry || isLoadingStudents || isLoadingSubjects || isLoadingAssessmentTypes || isLoadingAcademicPeriods;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTeacher && !isAdmin && !isSecretary) {
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
              Você não tem permissão para acessar esta página. Apenas professores, administradores e secretários podem lançar notas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback for no assignments
  if (!allClassesForEntry || allClassesForEntry.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8 text-primary" />
          Lançamento de Notas
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Turma Atribuída</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {isTeacher ? (
                <>
                  Você não tem turmas atribuídas para lançamento de notas. <br />
                  Por favor, entre em contato com a secretaria da escola para que as turmas sejam atribuídas ao seu perfil.
                </>
              ) : (isAdmin || isSecretary) ? (
                <>
                  Nenhuma turma cadastrada para a escola. <br />
                  Vá para <Link to="/classes" className="text-primary hover:underline">Gestão de Turmas</Link> para criar novas turmas.
                </>
              ) : (
                "Nenhuma turma disponível para lançamento de notas no momento."
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function for rendering selects with feedback
  const renderSelectWithFeedback = (
    id: string,
    label: string,
    data: { id: string; name: string }[] | undefined,
    isLoading: boolean,
    placeholder: string,
    onValueChange: (value: string) => void,
    currentValue: string | null | undefined,
    error: any,
    emptyMessage: string,
    isOptional: boolean = false
  ) => {
    const isDataEmpty = !data || data.length === 0;
    const isDisabled = isLoading || isDataEmpty;
    const displayValue = currentValue ?? (isOptional ? '' : '');

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Select 
          onValueChange={onValueChange} 
          value={displayValue}
          disabled={isDisabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
          </SelectTrigger>
          <SelectContent>
            {isOptional && <SelectItem value="">Nenhum</SelectItem>}
            {data?.map(item => (
              <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {isDataEmpty && !isLoading && (
          <p className="text-xs text-muted-foreground mt-1">
              {emptyMessage}
          </p>
        )}
      </div>
    );
  };

  const currentSelectedClassName = selectedClassDetails ? `${selectedClassDetails.name} (${selectedClassDetails.school_year})` : '';


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
                    form.setValue('classId', value === '' ? null : value);
                  }} 
                  value={form.watch('classId') ?? ''}
                  disabled={isLoadingClassesForEntry || allClassesForEntry.length === 0}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder={isLoadingClassesForEntry ? "Carregando turmas..." : "Selecione a turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma Turma</SelectItem>
                    {allClassesForEntry.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.school_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classId && <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>}
              </div>

              {/* CAMPO 2: Série / Ano (Condicional) */}
              <div className="space-y-2">
                <Label htmlFor="courseId">Série / Ano</Label>
                <Select 
                  onValueChange={(value) => form.setValue('courseId', value === '' ? null : value)} 
                  value={form.watch('courseId') ?? ''}
                  disabled={!selectedClassId || availableCoursesInClass.length === 0}
                >
                  <SelectTrigger id="courseId">
                    <SelectValue placeholder={!selectedClassId ? "Selecione uma turma" : (availableCoursesInClass.length === 0 ? "Nenhum curso associado" : "Selecione a série/ano")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma Série/Ano</SelectItem>
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
              {renderSelectWithFeedback(
                "subjectName",
                "Matéria",
                subjects,
                isLoadingSubjects,
                "Selecione a matéria",
                (value) => form.setValue('subjectName', value),
                form.watch('subjectName'),
                form.formState.errors.subjectName,
                "Nenhuma matéria cadastrada. Cadastre em Secretaria > Matérias.",
                false
              )}

              {/* CAMPO 4: Período Acadêmico */}
              {renderSelectWithFeedback(
                "period",
                "Período Acadêmico",
                academicPeriods,
                isLoadingAcademicPeriods,
                "Selecione o período",
                (value) => form.setValue('period', value),
                form.watch('period'),
                form.formState.errors.period,
                "Nenhum período acadêmico cadastrado. Cadastre em Secretaria > Matérias.",
                false
              )}

              {/* CAMPO 5: Tipo de Avaliação */}
              {renderSelectWithFeedback(
                "assessmentType",
                "Tipo de Avaliação (Opcional)",
                assessmentTypes,
                isLoadingAssessmentTypes,
                "Selecione o tipo",
                (value) => form.setValue('assessmentType', value === '' ? null : value),
                form.watch('assessmentType'),
                form.formState.errors.assessmentType,
                "Nenhum tipo de avaliação cadastrado. Cadastre em Secretaria > Matérias.",
                true
              )}
            </div>

            <Separator />

            {/* Tabela de Alunos e Notas */}
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Alunos da Turma {currentSelectedClassName}
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
                {selectedClassId ? "Nenhum aluno ativo encontrado nesta turma." : "Selecione uma turma para ver os alunos."}
              </p>
            )}
            {form.formState.errors.grades && <p className="text-sm text-destructive mt-2">{form.formState.errors.grades.message}</p>}

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={form.formState.isSubmitting || !isFormReady}
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