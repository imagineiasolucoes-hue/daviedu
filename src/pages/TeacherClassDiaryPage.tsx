import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, PlusCircle, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClassSelector from '@/components/class-diary/ClassSelector';
import ClassDiaryEntryForm from '@/components/class-diary/ClassDiaryEntryForm';
import ClassDiaryEntryCard from '@/components/class-diary/ClassDiaryEntryCard';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  full_name: string;
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
}

const TeacherClassDiaryPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isTeacher } = useProfile();
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [teacherClasses, setTeacherClasses] = useState<ClassData[]>([]);
  const [entries, setEntries] = useState<ClassDiaryEntry[]>([]);
  const [studentsInClass, setStudentsInClass] = useState<StudentData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ClassDiaryEntry | undefined>(undefined);

  const tenantId = profile?.tenant_id;
  const teacherId = profile?.employee_id;

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!teacherId || !tenantId) return;
      setIsLoadingClasses(true);
      const { data, error } = await supabase
        .from('teacher_classes')
        .select('class_id, classes(id, name)')
        .eq('employee_id', teacherId);

      if (error) {
        toast.error("Erro ao carregar turmas: " + error.message);
      } else {
        const classes = data?.map(tc => tc.classes).filter(Boolean) as ClassData[] || [];
        setTeacherClasses(classes);
        if (classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classes[0].id);
        }
      }
      setIsLoadingClasses(false);
    };

    fetchTeacherClasses();
  }, [teacherId, tenantId, selectedClassId]);

  useEffect(() => {
    const fetchEntriesAndStudents = async () => {
      if (!selectedClassId || !tenantId || !teacherId) {
        setEntries([]);
        setStudentsInClass([]);
        return;
      }

      setIsLoadingEntries(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('class_diary_entries')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('teacher_id', teacherId)
        .eq('tenant_id', tenantId)
        .eq('entry_date', formattedDate);

      if (entriesError) {
        toast.error("Erro ao carregar entradas do diário: " + entriesError.message);
        setEntries([]);
      } else {
        setEntries(entriesData || []);
      }

      // Fetch students for the selected class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('class_id', selectedClassId)
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
  }, [selectedClassId, selectedDate, tenantId, teacherId]);

  const handleSaveEntry = () => {
    setIsSheetOpen(false);
    setCurrentEntry(undefined);
    // Re-fetch entries after save
    const fetchEntries = async () => {
      if (!selectedClassId || !tenantId || !teacherId) return;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('class_diary_entries')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('teacher_id', teacherId)
        .eq('tenant_id', tenantId)
        .eq('entry_date', formattedDate);
      if (error) {
        toast.error("Erro ao recarregar entradas: " + error.message);
      } else {
        setEntries(data || []);
      }
    };
    fetchEntries();
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta entrada do diário?")) return;
    const { error } = await supabase
      .from('class_diary_entries')
      .delete()
      .eq('id', entryId)
      .eq('teacher_id', teacherId); // Ensure only the teacher who created can delete

    if (error) {
      toast.error("Erro ao excluir entrada: " + error.message);
    } else {
      toast.success("Entrada excluída com sucesso!");
      handleSaveEntry(); // Re-fetch entries
    }
  };

  const openAddEntrySheet = () => {
    setCurrentEntry(undefined);
    setIsSheetOpen(true);
  };

  const openEditEntrySheet = (entry: ClassDiaryEntry) => {
    setCurrentEntry(entry);
    setIsSheetOpen(true);
  };

  if (isProfileLoading || isLoadingClasses) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  if (!teacherId || !tenantId) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Erro de Perfil</h1>
        <p>Seu perfil de professor não está completo ou associado a um tenant.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CalendarDays className="h-8 w-8" /> Diário de Classe
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ClassSelector
          classes={teacherClasses}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          disabled={isLoadingClasses}
        />
        <div className="grid gap-2">
          <label htmlFor="date-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Data</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
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
        <div className="flex items-end">
          <Button onClick={openAddEntrySheet} className="w-full flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Adicionar Entrada
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Entradas para {selectedClassId ? teacherClasses.find(c => c.id === selectedClassId)?.name : 'Turma Selecionada'} em {format(selectedDate, 'PPP')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando entradas...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma entrada de diário para esta data e turma.</p>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <ClassDiaryEntryCard
                  key={entry.id}
                  entry={entry}
                  students={studentsInClass}
                  onEdit={openEditEntrySheet}
                  onDelete={handleDeleteEntry}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{currentEntry ? 'Editar Entrada do Diário' : 'Nova Entrada do Diário'}</SheetTitle>
            <SheetDescription>
              {currentEntry ? 'Edite os detalhes da entrada do diário.' : 'Crie uma nova entrada para o diário de classe.'}
            </SheetDescription>
          </SheetHeader>
          {selectedClassId && teacherId && tenantId ? (
            <ClassDiaryEntryForm
              initialData={currentEntry}
              classId={selectedClassId}
              teacherId={teacherId}
              tenantId={tenantId}
              onSave={handleSaveEntry}
              onCancel={() => setIsSheetOpen(false)}
            />
          ) : (
            <p className="text-red-500">Por favor, selecione uma turma e certifique-se de que seu perfil de professor está completo.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TeacherClassDiaryPage;