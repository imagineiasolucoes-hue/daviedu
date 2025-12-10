import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Corrected import
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

// Representa uma atribuição específica de turma-curso para um professor/admin
interface TeacherAssignedClassCourse {
  class_id: string;
  course_id: string;
  class_name: string;
  class_school_year: number;
  course_name: string;
  periods: ('Manhã' | 'Tarde' | 'Noite' | 'Integral')[]; // Períodos que o professor leciona esta combinação
}

// Interfaces auxiliares para tipar os dados brutos do Supabase
interface SupabaseClassCourseLink {
  course_id: string;
  courses: { id: string; name: string } | null;
}

interface SupabaseClassForAdmin {
  id: string;
  name: string;
  school_year: number;
  class_courses: SupabaseClassCourseLink[];
}

interface SupabaseTeacherAssignment {
  class_id: string;
  course_id: string;
  period: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  classes: { name: string; school_year: number } | null;
  courses: { name: string } | null;
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

const fetchClassesForGradeEntry = async (tenantId: string, employeeId: string | undefined, isTeacher: boolean, isAdmin: boolean): Promise<TeacherAssignedClassCourse[]> => {
  console.log("fetchClassesForGradeEntry: tenantId:", tenantId, "employeeId:", employeeId, "isTeacher:", isTeacher, "isAdmin:", isAdmin);

  if (isAdmin) {
    // Admin vê todas as turmas e seus associados cursos
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
    if (error) {
      console.error("fetchClassesForGradeEntry (Admin) Error:", error);
      throw new Error(error.message);
    }
    console.log("fetchClassesForGradeEntry (Admin) Raw Data:", data);

    // Transforma dados do admin para o formato TeacherAssignedClassCourse para consistência
    const adminClasses: TeacherAssignedClassCourse[] = [];
    (data as unknown as SupabaseClassForAdmin[]).forEach(cls => {
      cls.class_courses.forEach(cc => {
        if (cc.courses) {
          adminClasses.push({
            class_id: cls.id,
            course_id: cc.course_id,
            class_name: cls.name,
            class_school_year: cls.school_year,
            course_name: cc.courses.name,
            periods: ['Manhã', 'Tarde', 'Noite', 'Integral'], // Admins podem atribuir a todos os períodos para qualquer combinação turma-curso
          });
        }
      });
    });
    return adminClasses;

  } else if (isTeacher && employeeId) {
    // Professor vê apenas as turmas e cursos aos quais está atribuído
    const { data, error } = await supabase
      .from('teacher_classes')
      .select(`
        class_id,
        course_id,
        period,
        classes (
          name,
          school_year
        ),
        courses (name)
      `)
      .eq('employee_id', employeeId);

    if (error) {
      console.error("fetchClassesForGradeEntry (Teacher) Error:", error);
      throw new Error(error.message);
    }
    
    const rawTeacherAssignments = data as unknown as SupabaseTeacherAssignment[];
    console.log("fetchClassesForGradeEntry (Teacher) Raw Data:", rawTeacherAssignments);

    // Agrupa por class_id e course_id para consolidar períodos
    const groupedAssignments = new Map<string, TeacherAssignedClassCourse>();

    rawTeacherAssignments.forEach(assignment => {
      if (assignment.classes && assignment.courses) {
        const key = `${assignment.class_id}-${assignment.course_id}`;
        if (!groupedAssignments.has(key)) {
          groupedAssignments.set(key, {
            class_id: assignment.class_id,
            course_id: assignment.course_id,
            class_name: assignment.classes.name,
            class_school_year: assignment.classes.school_year,
            course_name: assignment.courses.name,
            periods: [],
          });
        }
        groupedAssignments.get(key)!.periods.push(assignment.period);
      }
    });

    return Array.from(groupedAssignments.values());
  }
  console.log("fetchClassesForGradeEntry: No classes returned (neither Admin nor Teacher conditions met).");
  return [];
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
  const { profile, isLoading: isProfileLoading, isTeacher, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const teacherEmployeeId = profile?.employee_id;

  useEffect(() => {
    if (!isProfileLoading) {
      console.log("GradeEntryPage Debug: Profile:", profile);
      console.log("GradeEntryPage Debug: isTeacher:", isTeacher, "isAdmin:", isAdmin, "employeeId:", teacherEmployeeId);
      if (!teacherEmployeeId && (isTeacher || isAdmin)) {
        toast.warning("Atenção", { description: "Seu perfil de professor/admin não está vinculado a um registro de funcionário (employee_id). O lançamento de notas pode falhar." });
      }
    }
  }, [isProfileLoading, isTeacher, isAdmin, teacherEmployeeId, profile]);

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

  const { data: allClassesForEntry, isLoading: isLoadingClassesForEntry, error: classesForEntryError } = useQuery<TeacherAssignedClassCourse[], Error>({
    queryKey: ['classesForGradeEntry', tenantId, teacherEmployeeId, isTeacher, isAdmin],
    queryFn: () => fetchClassesForGradeEntry(tenantId!, teacherEmployeeId, isTeacher, isAdmin),
    enabled: !!tenantId && (isTeacher || isAdmin),
  });
  
  useEffect(() => {
    if (classesForEntryError) {
      console.error("useQuery classesForGradeEntry Error:", classesForEntryError);
      toast.error("Erro ao carregar turmas", { description: classesForEntryError.message });
    }
    if (!isLoadingClassesForEntry) {
      console.log("allClassesForEntry data:", allClassesForEntry);
    }
  }, [classesForEntryError, isLoadingClassesForEntry, allClassesForEntry]);


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

  const selectedClassAssignments = useMemo(() => {
    const classes = allClassesForEntry || [];
    if (!selectedClassId) return [];
    return classes.filter(assignment => assignment.class_id === selectedClassId);
  }, [allClassesForEntry, selectedClassId]);

  const availableCoursesInClass = useMemo(() => {
    const coursesMap = new Map<string, Course>();
    selectedClassAssignments.forEach(assignment => {
      coursesMap.set(assignment.course_id, { id: assignment.course_id, name: assignment.course_name });
    });
    return Array.from(coursesMap.values());
  }, [selectedClassAssignments]);

  const availablePeriodsForSelectedClassCourse = useMemo(() => {
    const classes = allClassesForEntry || [];
    if (!selectedClassId || !selectedCourseId) return [];
    const assignment = classes.find(
      a => a.class_id === selectedClassId && a.course_id === selectedCourseId
    );
    return assignment ? assignment.periods : [];
  }, [allClassesForEntry, selectedClassId, selectedCourseId]);

  useEffect(() => {
    form.setValue('courseId', null, { shouldValidate: true });
    form.setValue('period', '', { shouldValidate: true });
  }, [selectedClassId, form]);

  useEffect(() => {
    form.setValue('period', '', { shouldValidate: true });
  }, [selectedCourseId, form]);

  useEffect(() => {
    if (students) {
      const currentGrades = form.getValues('grades');
      const newGrades = students.map(s => ({ studentId: s.id, gradeValue: null }));
      if (currentGrades.length !== newGrades.length || 
          !currentGrades.every((g, i) => g.studentId === newGrades[i].studentId)) {
        form.setValue('grades', newGrades);
      }
    } else {
      if (form.getValues('grades').length > 0) {
        form.setValue('grades', []);
      }
    }
  }, [students, form]);
  
  // NEW LOGIC: Determine if course selection is required
  const isCourseRequired = !!selectedClassId && availableCoursesInClass.length > 0;

  // NEW LOGIC: Update isFormReady to conditionally check selectedCourseId
  const isFormReady = !!selectedClassId && 
                      (isCourseRequired ? !!selectedCourseId : true) && 
                      !!selectedSubjectName && 
                      !!selectedPeriod;

  const onSubmit = async (data: GradeEntryFormData) => {
    if (!tenantId || !teacherEmployeeId) { 
      toast.error("Erro de Permissão", { description: "Seu perfil não está vinculado a um funcionário/professor. Apenas administradores e professores cadastrados podem lançar notas." });
      return;
    }

    // Validation check moved from isFormReady to onSubmit for explicit error message
    if (isCourseRequired && !data.courseId) {
        toast.error("Erro", { description: "Selecione a Série/Ano para a qual as notas se aplicam." });
        return;
    }
    
    // If course is not required, ensure it is null in the payload
    if (!isCourseRequired) {
        data.courseId = null;
    }


    const gradesToInsert = data.grades
      .filter(g => g.gradeValue !== null && g.gradeValue !== undefined) 
      .map(g => ({
        tenant_id: tenantId,
        student_id: g.studentId,
        class_id: data.classId,
        course_id: data.courseId,
        subject_name: data.subjectName,
        grade_value: g.gradeValue,
        assessment_type: data.assessmentType || null, 
        period: data.period,
        teacher_id: teacherEmployeeId,
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
      console.error("Error submitting grades:", error);
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

  const currentSelectedClass = useMemo(() => {
    const classAssignment = (allClassesForEntry || []).find(a => a.class_id === selectedClassId);
    return classAssignment ? `${classAssignment.class_name} (${classAssignment.class_school_year})` : '';
  }, [allClassesForEntry, selectedClassId]);


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
                  disabled={isLoadingClassesForEntry || allClassesForEntry?.length === 0}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder={isLoadingClassesForEntry ? "Carregando turmas..." : "Selecione a turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma Turma</SelectItem>
                    {Array.from(new Map((allClassesForEntry || []).map(a => [a.class_id, a])).values()).map(c => (
                      <SelectItem key={c.class_id} value={c.class_id}>
                        {c.class_name} ({c.class_school_year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.classId && <p className="text-sm text-destructive">{form.formState.errors.classId.message}</p>}
                {(!allClassesForEntry || allClassesForEntry.length === 0) && !isLoadingClassesForEntry && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTeacher ? (
                      <>
                        Nenhuma turma atribuída a você. <br />
                        Por favor, entre em contato com a secretaria da escola para que as turmas sejam atribuídas ao seu perfil.
                      </>
                    ) : isAdmin ? (
                      <>
                        Nenhuma turma cadastrada para a escola. <br />
                        Vá para <Link to="/classes" className="text-primary hover:underline">Gestão de Turmas</Link> para criar novas turmas.
                      </>
                    ) : (
                      "Nenhuma turma encontrada."
                    )}
                  </p>
                )}
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

              {/* CAMPO 4: Período */}
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select 
                  onValueChange={(value) => form.setValue('period', value)} 
                  value={form.watch('period') || ''}
                  disabled={!selectedClassId || (isCourseRequired && !selectedCourseId) || availablePeriodsForSelectedClassCourse.length === 0}
                >
                  <SelectTrigger id="period">
                    <SelectValue placeholder={!selectedClassId || (isCourseRequired && !selectedCourseId) ? "Selecione turma e série" : (availablePeriodsForSelectedClassCourse.length === 0 ? "Nenhum período disponível" : "Selecione o período")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriodsForSelectedClassCourse.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.period && <p className="text-sm text-destructive">{form.formState.errors.period.message}</p>}
                {selectedClassId && (isCourseRequired ? selectedCourseId : true) && availablePeriodsForSelectedClassCourse.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Nenhum período disponível para esta combinação de turma e série/ano.
                  </p>
                )}
              </div>

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
              Alunos da Turma {currentSelectedClass}
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