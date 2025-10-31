import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddStudentSheet from '@/components/students/AddStudentSheet';
import EditStudentSheet from '@/components/students/EditStudentSheet';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
  status: string;
  phone: string | null;
  classes: { name: string } | null;
}

const fetchStudents = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select(`id, full_name, registration_code, status, phone, classes (name)`)
    .eq('tenant_id', tenantId)
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as unknown as Student[];
};

const StudentsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students, isLoading: isStudentsLoading, error } = useQuery<Student[], Error>({
    queryKey: ['students', tenantId],
    queryFn: () => fetchStudents(tenantId!),
    enabled: !!tenantId,
  });

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  if (isProfileLoading || isStudentsLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar alunos: {error.message}</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case 'pre-enrolled': return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">Pré-Matriculado</Badge>;
      case 'inactive': return <Badge variant="destructive">Inativo</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Alunos</h1>
        <AddStudentSheet />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos ({students?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.registration_code}</TableCell>
                    <TableCell>{student.phone || 'N/A'}</TableCell>
                    <TableCell>{student.classes?.name || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(student)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(student)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {students?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhum aluno cadastrado.</p>
          )}
        </CardContent>
      </Card>

      <EditStudentSheet
        studentId={selectedStudent?.id || null}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
      />
      <DeleteStudentDialog
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.full_name || null}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default StudentsPage;