import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Student {
  id: string;
  full_name: string;
}

interface AttendanceManagerProps {
  students: Student[];
  attendance: { student_id: string; status: 'present' | 'absent' | 'late' }[];
  onAttendanceChange: (studentId: string, status: 'present' | 'absent' | 'late') => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  attendance,
  onAttendanceChange,
}) => {
  const getStatus = (studentId: string) => {
    return attendance.find(a => a.student_id === studentId)?.status || 'present';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Frequência dos Alunos</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="grid gap-4">
            {students.length === 0 ? (
              <p className="text-muted-foreground">Nenhum aluno encontrado para esta turma.</p>
            ) : (
              students.map((student) => (
                <div key={student.id} className="flex items-center justify-between">
                  <Label htmlFor={`attendance-${student.id}`} className="flex-grow">
                    {student.full_name}
                  </Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`present-${student.id}`}
                        checked={getStatus(student.id) === 'present'}
                        onCheckedChange={() => onAttendanceChange(student.id, 'present')}
                      />
                      <Label htmlFor={`present-${student.id}`}>Presente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`absent-${student.id}`}
                        checked={getStatus(student.id) === 'absent'}
                        onCheckedChange={() => onAttendanceChange(student.id, 'absent')}
                      />
                      <Label htmlFor={`absent-${student.id}`}>Ausente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`late-${student.id}`}
                        checked={getStatus(student.id) === 'late'}
                        onCheckedChange={() => onAttendanceChange(student.id, 'late')}
                      />
                      <Label htmlFor={`late-${student.id}`}>Atraso</Label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AttendanceManager;