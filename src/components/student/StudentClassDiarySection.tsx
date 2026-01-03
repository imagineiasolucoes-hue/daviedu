import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import ClassDiaryEntryCard from '@/components/class-diary/ClassDiaryEntryCard';

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
  const [studentsInClass, setStudentsInClass] = useState<{ id: string; full_name: string }[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  const tenantId = profile?.tenant_id;
  const studentId = studentInfo.id;
  const classId = studentInfo.class_id;

  useEffect(() => {
    const fetchEntriesAndStudents = async () => {
      if (!classId || !tenantId || !studentId) {
        setEntries([]);
        setStudentsInClass([]);
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

      // Fetch students for the selected class (needed for attendance display)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('class_id', classId)
        .eq('tenant_id', tenantId)
        .order('full_name', { ascending: true });

      if (studentsError) {
        toast.error("Erro ao carregar alunos da turma: " + studentsError.message);
        setStudentsInClass([]);
      } else {
        setStudentsInClass(studentsData || []);
      }

      setIsLoadingEntries(false);
    };

    fetchEntriesAndStudents();
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
          <CalendarDays className="h-5 w-5" /> Diário de Classe
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
          <CardTitle className="text-lg">Entradas para {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando entradas...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma entrada de diário para esta data.</p>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <Card key={entry.id} className="border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Professor:</span> {entry.employees?.full_name || 'N/A'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{format(parseISO(entry.entry_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <ClassDiaryEntryCard
                    entry={entry}
                    students={studentsInClass}
                    showActions={false} // Alunos apenas visualizam, sem edição/exclusão
                  />
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentClassDiarySection;