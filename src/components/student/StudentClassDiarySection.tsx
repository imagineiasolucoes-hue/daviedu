import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, CalendarDays, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface StudentInfo {
  id: string;
  full_name: string;
  class_id: string | null;
  tenant_id: string;
}

interface ClassDiaryEntry {
  id: string;
  entry_date: string;
  content: string;
  homework?: string | null;
  general_observations?: string | null;
  attendance?: { student_id: string; status: 'present' | 'absent' | 'late' }[];
  class_id: string;
  teacher_id: string;
  tenant_id: string;
  employees: { full_name: string } | null; // Para exibir o nome do professor
}

interface StudentClassDiarySectionProps {
  studentInfo: StudentInfo;
}

const StudentClassDiarySection: React.FC<StudentClassDiarySectionProps> = ({ studentInfo }) => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [entries, setEntries] = useState<ClassDiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const tenantId = profile?.tenant_id;
  const studentId = studentInfo.id;
  const classId = studentInfo.class_id;

  useEffect(() => {
    const fetchEntries = async () => {
      if (!classId || !tenantId || !studentId) {
        setEntries([]);
        return;
      }

      setIsLoadingEntries(true);
      
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const formattedMonthStart = format(monthStart, 'yyyy-MM-dd');
      const formattedMonthEnd = format(monthEnd, 'yyyy-MM-dd');

      // Fetch entries for the student's class for the entire current month
      const { data: entriesData, error: entriesError } = await supabase
        .from('class_diary_entries')
        .select('*, employees(full_name)')
        .eq('class_id', classId)
        .eq('tenant_id', tenantId)
        .gte('entry_date', formattedMonthStart) // Filtra do início do mês
        .lte('entry_date', formattedMonthEnd)   // Filtra até o fim do mês
        .order('entry_date', { ascending: false });

      if (entriesError) {
        toast.error("Erro ao carregar entradas do diário: " + entriesError.message);
        setEntries([]);
      } else {
        setEntries(entriesData || []);
      }

      setIsLoadingEntries(false);
    };

    fetchEntries();
  }, [classId, tenantId, studentId, currentMonth]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  if (!classId) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Você não está vinculado a uma turma. Entre em contato com a secretaria.
      </div>
    );
  }

  // Agrupar entradas por dia
  const entriesByDay: { [key: string]: ClassDiaryEntry[] } = {};
  entries.forEach(entry => {
    const dateKey = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
    if (!entriesByDay[dateKey]) {
      entriesByDay[dateKey] = [];
    }
    entriesByDay[dateKey].push(entry);
  });

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Minha Frequência - {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequência do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando registros de frequência...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daysInMonth.map(day => {
                const formattedDay = format(day, 'dd/MM/yyyy');
                const dayEntries = entriesByDay[format(day, 'yyyy-MM-dd')] || [];

                return (
                  <Card key={formattedDay} className="border p-4">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-base">{formattedDay}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dayEntries.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Nenhuma aula registrada.</p>
                      ) : (
                        <div className="space-y-2">
                          {dayEntries.map(entry => {
                            const studentAttendance = entry.attendance?.find(a => a.student_id === studentId);
                            const statusText = studentAttendance ? (
                              studentAttendance.status === 'present' ? 'Presente' :
                              studentAttendance.status === 'absent' ? 'Ausente' :
                              'Atraso'
                            ) : 'Não Registrado';

                            const statusColor = studentAttendance ? (
                              studentAttendance.status === 'present' ? 'text-green-600' :
                              studentAttendance.status === 'absent' ? 'text-red-600' :
                              'text-yellow-600'
                            ) : 'text-muted-foreground';

                            return (
                              <div key={entry.id} className="flex justify-between items-center text-sm">
                                <p>Professor: {entry.employees?.full_name || 'N/A'}</p>
                                <p>Status: <span className={cn("font-bold", statusColor)}>{statusText}</span></p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentClassDiarySection;