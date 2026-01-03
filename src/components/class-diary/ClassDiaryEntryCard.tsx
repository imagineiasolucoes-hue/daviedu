import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, UserCheck, ClipboardList, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ClassDiaryEntryCardProps {
  entry: {
    id: string;
    entry_date: string;
    content: string;
    homework?: string | null;
    general_observations?: string | null;
    attendance?: { student_id: string; status: 'present' | 'absent' | 'late' }[];
  };
  students: { id: string; full_name: string }[]; // Lista de alunos para resolver IDs
  onEdit?: (entry: any) => void;
  onDelete?: (entryId: string) => void;
  showActions?: boolean;
}

const ClassDiaryEntryCard: React.FC<ClassDiaryEntryCardProps> = ({
  entry,
  students,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const formattedDate = format(parseISO(entry.entry_date), 'dd/MM/yyyy');

  const getStudentName = (studentId: string) => {
    return students.find(s => s.id === studentId)?.full_name || 'Aluno Desconhecido';
  };

  const presentStudents = entry.attendance?.filter(a => a.status === 'present') || [];
  const absentStudents = entry.attendance?.filter(a => a.status === 'absent') || [];
  const lateStudents = entry.attendance?.filter(a => a.status === 'late') || [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Entrada de {formattedDate}</CardTitle>
        {showActions && (
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4" /> Conteúdo da Aula:</h4>
          <p className="text-sm text-muted-foreground pl-6">{entry.content}</p>
        </div>

        {entry.homework && (
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-1"><ClipboardList className="h-4 w-4" /> Tarefa de Casa:</h4>
            <p className="text-sm text-muted-foreground pl-6">{entry.homework}</p>
          </div>
        )}

        {entry.general_observations && (
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-1"><MessageSquare className="h-4 w-4" /> Observações Gerais:</h4>
            <p className="text-sm text-muted-foreground pl-6">{entry.general_observations}</p>
          </div>
        )}

        {entry.attendance && entry.attendance.length > 0 && (
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-1"><UserCheck className="h-4 w-4" /> Frequência:</h4>
            <div className="pl-6 text-sm">
              {presentStudents.length > 0 && (
                <p><strong>Presentes ({presentStudents.length}):</strong> {presentStudents.map(a => getStudentName(a.student_id)).join(', ')}</p>
              )}
              {absentStudents.length > 0 && (
                <p><strong>Ausentes ({absentStudents.length}):</strong> {absentStudents.map(a => getStudentName(a.student_id)).join(', ')}</p>
              )}
              {lateStudents.length > 0 && (
                <p><strong>Atrasos ({lateStudents.length}):</strong> {lateStudents.map(a => getStudentName(a.student_id)).join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClassDiaryEntryCard;