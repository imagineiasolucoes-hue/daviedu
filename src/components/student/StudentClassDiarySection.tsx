import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, CalendarDays, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<ClassDiaryEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

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
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Fetch entries for the student's class and selected date
      const { data: entriesData, error: entriesError } = await supabase
        .from('class_diary_entries')
        .select('*, employees(full_name)')
        .eq('class_id', classId)
        .eq('tenant_id', tenantId)
        .eq('entry_date', formattedDate)
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
  }, [classId, tenantId, studentId, selectedDate]);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Minha Frequência
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frequência em {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando registros de frequência...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">Nenhum registro de frequência para esta data.</p>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => {
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
                  <Card key={entry.id} className="border p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold">Data: {format(parseISO(entry.entry_date), 'dd/MM/yyyy')}</p>
                      <p className="text-sm text-muted-foreground">Professor: {entry.employees?.full_name || 'N/A'}</p>
                    </div>
                    <p className="text-base">Status: <span className={cn("font-bold", statusColor)}>{statusText}</span></p>
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