import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import AttendanceManager from './AttendanceManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClassDiaryEntryFormProps {
  initialData?: {
    id?: string;
    entry_date: string;
    content: string;
    homework?: string | null;
    general_observations?: string | null;
    attendance?: { student_id: string; status: 'present' | 'absent' | 'late' }[];
  };
  classId: string;
  teacherId: string;
  tenantId: string;
  onSave: () => void;
  onCancel: () => void;
}

interface Student {
  id: string;
  full_name: string;
}

const ClassDiaryEntryForm: React.FC<ClassDiaryEntryFormProps> = ({
  initialData,
  classId,
  teacherId,
  tenantId,
  onSave,
  onCancel,
}) => {
  const [entryDate, setEntryDate] = useState<Date | undefined>(
    initialData?.entry_date ? parseISO(initialData.entry_date) : new Date()
  );
  const [content, setContent] = useState(initialData?.content || '');
  const [homework, setHomework] = useState(initialData?.homework || '');
  const [generalObservations, setGeneralObservations] = useState(initialData?.general_observations || '');
  const [attendance, setAttendance] = useState<{ student_id: string; status: 'present' | 'absent' | 'late' }[]>(
    initialData?.attendance || []
  );
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;
      setIsLoadingStudents(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('class_id', classId)
        .eq('tenant_id', tenantId)
        .order('full_name', { ascending: true });

      if (error) {
        toast.error("Erro ao carregar alunos: " + error.message);
      } else {
        setStudents(data || []);
        // Initialize attendance if not already set
        if (!initialData?.attendance || initialData.attendance.length === 0) {
          setAttendance(data.map(s => ({ student_id: s.id, status: 'present' })));
        }
      }
      setIsLoadingStudents(false);
    };

    fetchStudents();
  }, [classId, tenantId, initialData?.attendance]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.student_id === studentId);
      if (existing) {
        return prev.map(a => a.student_id === studentId ? { ...a, status } : a);
      }
      return [...prev, { student_id: studentId, status }];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDate || !content || !classId || !teacherId || !tenantId) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSaving(true);
    const entryData = {
      entry_date: format(entryDate, 'yyyy-MM-dd'),
      content,
      homework: homework || null,
      general_observations: generalObservations || null,
      attendance: attendance,
      class_id: classId,
      teacher_id: teacherId,
      tenant_id: tenantId,
    };

    console.log("Attempting to save entryData:", entryData); // DEBUG: Log data being sent

    let error = null;
    if (initialData?.id) {
      // Update existing entry
      const { error: updateError } = await supabase
        .from('class_diary_entries')
        .update(entryData)
        .eq('id', initialData.id);
      error = updateError;
    } else {
      // Create new entry
      const { error: insertError } = await supabase
        .from('class_diary_entries')
        .insert(entryData);
      error = insertError;
    }

    if (error) {
      console.error("Supabase save error:", error); // DEBUG: Log Supabase error
      toast.error("Erro ao salvar entrada do diário: " + error.message);
    } else {
      toast.success("Entrada do diário salva com sucesso!");
      onSave();
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="entryDate">Data da Entrada</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !entryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {entryDate ? format(entryDate, "PPP") : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={entryDate}
              onSelect={setEntryDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">Conteúdo da Aula</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          placeholder="Descreva o que foi ensinado na aula..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="homework">Tarefa de Casa (Opcional)</Label>
        <Textarea
          id="homework"
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder="Descreva a tarefa de casa..."
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="generalObservations">Observações Gerais (Opcional)</Label>
        <Textarea
          id="generalObservations"
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Adicione observações sobre o comportamento da turma, eventos, etc."
        />
      </div>

      {isLoadingStudents ? (
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Carregando alunos...</span>
        </div>
      ) : (
        <AttendanceManager
          students={students}
          attendance={attendance}
          onAttendanceChange={handleAttendanceChange}
        />
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {initialData?.id ? 'Salvar Alterações' : 'Adicionar Entrada'}
        </Button>
      </div>
    </form>
  );
};

export default ClassDiaryEntryForm;