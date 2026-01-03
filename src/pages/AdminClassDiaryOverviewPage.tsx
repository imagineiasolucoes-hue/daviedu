import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, CalendarDays, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClassSelector from '@/components/class-diary/ClassSelector';
import ClassDiaryEntryCard from '@/components/class-diary/ClassDiaryEntryCard';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
}

interface TeacherData {
  id: string;
  full_name: string;
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
  employees: { full_name: string } | null; // Para exibir o nome do professor
  classes: { name: string } | null; // Para exibir o nome da turma
}

const AdminClassDiaryOverviewPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading, isAdmin, isSecretary } = useProfile();
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherData[]>([]);
  const [entries, setEntries] = useState<ClassDiaryEntry[]>([]);
  const [studentsInClass, setStudentsInClass] = useState<StudentData[]>([]); // Para resolver nomes de alunos
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const tenantId = profile?.tenant_id;

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!tenantId) return;
      setIsLoadingData(true);

      // Fetch all classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (classesError) {
        toast.error("Erro ao carregar turmas: " + classesError.message);
      } else {
        setAllClasses(classesData || []);
      }

      // Fetch all teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('tenant_id', tenantId)
        .eq('is_teacher', true)
        .order('full_name', { ascending: true });

      if (teachersError) {
        toast.error("Erro ao carregar professores: " + teachersError.message);
      } else {
        setAllTeachers(teachersData || []);
      }
      setIsLoadingData(false);
    };

    fetchInitialData();
  }, [tenantId]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!tenantId) {
        setEntries([]);
        return;
      }

      setIsSearching(true);
      let query = supabase
        .from('class_diary_entries')
        .select('*, employees(full_name), classes(name)')
        .eq('tenant_id', tenantId)
        .order('entry_date', { ascending: false });

      if (selectedClassId) {
        query = query.eq('class_id', selectedClassId);
      }
      if (selectedTeacherId) {
        query = query.eq('teacher_id', selectedTeacherId);
      }
      if (selectedDate) {
        query = query.eq('entry_date', format(selectedDate, 'yyyy-MM-dd'));
      }

      const { data: entriesData, error: entriesError } = await query;

      if (entriesError) {
        toast.error("Erro ao carregar entradas do diário: " + entriesError.message);
        setEntries([]);
      } else {
        setEntries(entriesData || []);
      }

      // Fetch students for the selected class if a class is selected
      if (selectedClassId) {
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
      } else {
        setStudentsInClass([]); // Clear students if no class is selected
      }

      setIsSearching(false);
    };

    fetchEntries();
  }, [tenantId, selectedClassId, selectedTeacherId, selectedDate]);

  if (isProfileLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin && !isSecretary) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <CalendarDays className="h-8 w-8" /> Visão Geral do Diário de Classe
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ClassSelector
              classes={allClasses}
              selectedClassId={selectedClassId}
              onSelectClass={setSelectedClassId}
              label="Filtrar por Turma"
              placeholder="Todas as turmas"
            />
            <div className="grid gap-2">
              <Label htmlFor="teacher-select">Filtrar por Professor</Label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
              >
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder="Todos os professores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os professores</SelectItem>
                  {allTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-select">Filtrar por Data</Label>
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
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => {
              setSelectedClassId(undefined);
              setSelectedTeacherId(undefined);
              setSelectedDate(undefined);
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Entradas do Diário</CardTitle>
        </CardHeader>
        <CardContent>
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Buscando entradas...</p>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma entrada de diário encontrada com os filtros aplicados.</p>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <Card key={entry.id} className="border p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Turma:</span> {entry.classes?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Professor:</span> {entry.employees?.full_name || 'N/A'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{format(parseISO(entry.entry_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <ClassDiaryEntryCard
                    entry={entry}
                    students={studentsInClass} // Note: This will only show students if a class is selected in the filter
                    showActions={false} // Admins only view, no edit/delete
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

export default AdminClassDiaryOverviewPage;