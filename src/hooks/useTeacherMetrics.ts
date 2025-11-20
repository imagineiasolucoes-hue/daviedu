import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface TeacherMetrics {
  totalClasses: number;
  totalStudents: number;
  // Placeholder para métricas futuras
  pendingGrades: number; 
}

const fetchTeacherMetrics = async (tenantId: string, employeeId: string): Promise<TeacherMetrics> => {
  // 1. Contar Turmas (agora por atribuição única de turma-curso-período)
  const { data: teacherClassesData, error: teacherClassesError } = await supabase
    .from('teacher_classes')
    .select('class_id, course_id, period') // Select all parts of the composite PK
    .eq('employee_id', employeeId);

  if (teacherClassesError) throw new Error(`Erro ao buscar atribuições de turmas: ${teacherClassesError.message}`);

  // Count unique class-course pairs for "totalClasses"
  const uniqueClassCoursePairs = new Set(
    teacherClassesData.map(tc => `${tc.class_id}-${tc.course_id}`)
  );
  const totalClasses = uniqueClassCoursePairs.size;

  // 2. Contar Alunos nas turmas atribuídas (alunos únicos por class_id)
  const classIds = [...new Set(teacherClassesData.map(d => d.class_id))]; // Get unique class_ids

  let totalStudents = 0;
  if (classIds.length > 0) {
    const { count: studentsCount, error: studentsError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('class_id', classIds)
      .eq('status', 'active');

    if (studentsError) throw new Error(`Erro ao contar alunos: ${studentsError.message}`);
    totalStudents = studentsCount ?? 0;
  }

  return {
    totalClasses: totalClasses, // Updated to count unique class-course pairs
    totalStudents: totalStudents,
    pendingGrades: Math.floor(Math.random() * 10) + 1, // Mock: 1 a 10 notas pendentes
  };
};

export const useTeacherMetrics = () => {
  const { profile, isTeacher, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;
  const employeeId = profile?.employee_id;

  const { data, isLoading, error } = useQuery<TeacherMetrics, Error>({
    queryKey: ['teacherMetrics', tenantId, employeeId],
    queryFn: () => fetchTeacherMetrics(tenantId!, employeeId!),
    enabled: !!tenantId && !!employeeId && isTeacher && !isProfileLoading,
  });

  return {
    metrics: data,
    isLoading: isLoading || isProfileLoading,
    error,
  };
};