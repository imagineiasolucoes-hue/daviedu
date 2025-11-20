import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddTeacherSheet from '@/components/teachers/AddTeacherSheet';
import EditTeacherSheet from '@/components/teachers/EditTeacherSheet';
import DeleteTeacherDialog from '@/components/teachers/DeleteTeacherDialog';
import { formatCurrency } from '@/lib/utils';

interface Teacher {
  id: string;
  full_name: string;
  main_subject: string | null;
  status: string;
  base_salary: number;
  // Novos campos
  email: string | null;
  phone: string | null;
  // Relacionamento com turmas, agora incluindo o curso
  teacher_classes: {
    period: string;
    classes: {
      name: string;
      school_year: number;
    } | null;
    courses: { // NOVO: Adicionado para buscar o nome do curso
      name: string;
    } | null;
  }[];
}

const fetchTeachers = async (tenantId: string): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, 
      full_name, 
      main_subject, 
      status, 
      base_salary,
      email,
      phone,
      teacher_classes (
        period,
        classes (
          name,
          school_year
        ),
        courses (name)
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_teacher', true)
    .order('full_name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as unknown as Teacher[];
};

const TeachersPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const { data: teachers, isLoading: isTeachersLoading, error } = useQuery<Teacher[], Error>({
    queryKey: ['teachers', tenantId],
    queryFn: () => fetchTeachers(tenantId!),
    enabled: !!tenantId,
  });

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  if (isProfileLoading || isTeachersLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar professores: {error.message}</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case 'inactive': return <Badge variant="destructive">Inativo</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Professores</h1>
        <AddTeacherSheet />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Professores ({teachers?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Matéria Principal</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Salário Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                    <TableCell>{teacher.main_subject || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {teacher.teacher_classes.length > 0 ? (
                          teacher.teacher_classes.map((tc, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tc.classes?.name} ({tc.courses?.name}) ({tc.period})
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">Nenhuma</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(teacher.base_salary)}</TableCell>
                    <TableCell>{getStatusBadge(teacher.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(teacher)} className="text-destructive">
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
          {teachers?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhum professor cadastrado.</p>
          )}
        </CardContent>
      </Card>

      <EditTeacherSheet
        teacherId={selectedTeacher?.id || null}
        open={isEditSheetOpen}
        onOpenChange={setIsEditSheetOpen}
      />
      <DeleteTeacherDialog
        teacherId={selectedTeacher?.id || null}
        teacherName={selectedTeacher?.full_name || null}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default TeachersPage;