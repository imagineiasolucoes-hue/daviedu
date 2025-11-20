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
  // 1. Contar Turmas
  const { count: totalClasses, error: classesError } = await supabase
    .from('teacher_classes')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employeeId);

  if (classesError) throw new Error(`Erro ao contar turmas: ${classesError.message}`);

  // 2. Contar Alunos nas turmas
  // Primeiro, buscamos os IDs das turmas
  const { data: classIdsData, error: fetchIdsError } = await supabase
    .from('teacher_classes')
    .select('class_id')
    .eq('employee_id', employeeId);

  if (fetchIdsError) throw new Error(`Erro ao buscar IDs das turmas: ${fetchIdsError.message}`);

  const classIds = classIdsData.map(d => d.class_id);

  let totalStudents = 0;
  if (classIds.length > 0) {
    // Contamos os alunos que pertencem a qualquer uma dessas turmas
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
    totalClasses: totalClasses ?? 0,
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