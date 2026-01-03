import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ptBR } from 'date-fns/locale';

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

  // Agrupar entradas por dia e consolidar status de frequência
  const attendanceByDay: { [key: string]: { status: 'present' | 'absent' | 'late' | 'not_recorded'; teacher?: string } } = {};
  entries.forEach(entry => {
    const dateKey = format(parseISO(entry.entry_date), 'yyyy-MM-dd');
    const studentAttendance = entry.attendance?.find(a => a.student_id === studentId);
    
    if (!attendanceByDay[dateKey]) {
      attendanceByDay[dateKey] = { status: 'not_recorded' }; // Default
    }

    // Lógica de consolidação: Ausente > Atraso > Presente
    if (studentAttendance) {
      if (studentAttendance.status === 'absent') {
        attendanceByDay[dateKey].status = 'absent';
      } else if (studentAttendance.status === 'late' && attendanceByDay[dateKey].status !== 'absent') {
        attendanceByDay[dateKey].status = 'late';
      } else if (studentAttendance.status === 'present' && attendanceByDay[dateKey].status === 'not_recorded') {
        attendanceByDay[dateKey].status = 'present';
      }
      // Se houver múltiplas aulas no dia, o professor pode ser o da última entrada ou o mais relevante
      // Por simplicidade, vamos apenas pegar o status consolidado.
    }
  });

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  // Preencher dias vazios no início do mês para alinhar com a semana
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = getDay(firstDayOfMonth); // 0 = Domingo, 1 = Segunda...
  const emptyDaysBefore = Array.from({ length: startingDayIndex }).map((_, i) => `empty-${i}`);

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStatusColorClass = (status: 'present' | 'absent' | 'late' | 'not_recorded') => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'not_recorded': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusText = (status: 'present' | 'absent' | 'late' | 'not_recorded') => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent': return 'Ausente';
      case 'late': return 'Atraso';
      case 'not_recorded': return 'N/R';
      default: return 'N/R';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Minha Frequência
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-lg">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visão Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando registros de frequência...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekdays.map(day => (
                <div key={day} className="font-semibold text-sm text-muted-foreground">
                  {day}
                </div>
              ))}
              {emptyDaysBefore.map(key => (
                <div key={key} className="h-16 w-full"></div> // Espaços vazios para alinhar o calendário
              ))}
              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayAttendance = attendanceByDay[dateKey];
                const status = dayAttendance?.status || 'not_recorded';
                const teacherName = dayAttendance?.teacher; // Se tivéssemos consolidado o professor

                return (
                  <div key={dateKey} className={cn(
                    "h-16 w-full flex flex-col items-center justify-center rounded-md border",
                    getStatusColorClass(status)
                  )}>
                    <span className="text-sm font-bold">{format(day, 'd')}</span>
                    <span className="text-xs">{getStatusText(status)}</span>
                    {/* Se quisermos mostrar o professor, precisaríamos de uma lógica de consolidação mais complexa */}
                    {/* {teacherName && <span className="text-xs text-gray-500">{teacherName}</span>} */}
                  </div>
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