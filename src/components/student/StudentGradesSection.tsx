import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface StudentInfo {
  id: string;
  full_name: string;
  class_id: string | null;
  tenant_id: string;
}

interface GradeEntry {
  id: string;
  subject_name: string;
  grade_value: number;
  period: string;
  assessment_type?: string | null;
  teacher_id?: string | null;
  employees: { full_name: string } | null; // Para exibir o nome do professor
}

interface StudentGradesSectionProps {
  studentInfo: StudentInfo;
}

const StudentGradesSection: React.FC<StudentGradesSectionProps> = ({ studentInfo }) => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  const tenantId = profile?.tenant_id;
  const studentId = studentInfo.id;

  // Critério de aprovação (pode ser configurável no futuro)
  const PASSING_GRADE = 7.0;

  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId || !tenantId) {
        setGrades([]);
        return;
      }

      setIsLoadingGrades(true);

      const { data, error } = await supabase
        .from('grades')
        .select('*, employees(full_name)')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .order('period', { ascending: true })
        .order('subject_name', { ascending: true });

      if (error) {
        toast.error("Erro ao carregar notas: " + error.message);
        setGrades([]);
      } else {
        setGrades(data || []);
      }
      setIsLoadingGrades(false);
    };

    fetchGrades();
  }, [studentId, tenantId]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Não foi possível carregar as notas. ID do aluno não encontrado.
      </div>
    );
  }

  // Agrupar notas por período e depois por matéria
  const gradesByPeriod: { [period: string]: { [subject: string]: GradeEntry[] } } = {};
  grades.forEach(grade => {
    if (!gradesByPeriod[grade.period]) {
      gradesByPeriod[grade.period] = {};
    }
    if (!gradesByPeriod[grade.period][grade.subject_name]) {
      gradesByPeriod[grade.period][grade.subject_name] = [];
    }
    gradesByPeriod[grade.period][grade.subject_name].push(grade);
  });

  const periods = Object.keys(gradesByPeriod).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <GraduationCap className="h-5 w-5" /> Boletim Escolar
      </h2>

      {isLoadingGrades ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Carregando notas...</p>
        </div>
      ) : grades.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nenhuma nota encontrada para este aluno.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {periods.map(period => (
            <Card key={period}>
              <CardHeader>
                <CardTitle className="text-lg">Período: {period}</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(gradesByPeriod[period]).sort().map(subject => {
                  const subjectGrades = gradesByPeriod[period][subject];
                  const average = subjectGrades.reduce((sum, g) => sum + g.grade_value, 0) / subjectGrades.length;
                  const isApproved = average >= PASSING_GRADE;

                  return (
                    <div key={subject} className="mb-4 last:mb-0">
                      <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" /> {subject}
                        <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Média: {average.toFixed(1)} ({isApproved ? 'Aprovado' : 'Reprovado'})
                        </span>
                      </h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]">Avaliação</TableHead>
                              <TableHead>Professor</TableHead>
                              <TableHead className="text-right">Nota</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subjectGrades.map(grade => (
                              <TableRow key={grade.id}>
                                <TableCell className="font-medium">{grade.assessment_type || 'Nota'}</TableCell>
                                <TableCell>{grade.employees?.full_name || 'N/A'}</TableCell>
                                <TableCell className="text-right font-bold">{grade.grade_value.toFixed(1)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentGradesSection;