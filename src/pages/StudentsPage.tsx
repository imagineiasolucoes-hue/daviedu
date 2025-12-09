import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Pencil, Trash2, User, Search, Filter, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddStudentSheet from '@/components/students/AddStudentSheet';
import EditStudentSheet from '@/components/students/EditStudentSheet';
import DeleteStudentDialog from '@/components/students/DeleteStudentDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
  status: string;
  phone: string | null;
  classes: { name: string } | null;
}

interface Class {
  id: string;
  name: string;
  school_year: number;
}

interface StudentFilters {
  name: string;
  registrationCode: string;
  status: string;
  classId: string;
}

interface PaginatedStudents {
  data: Student[];
  totalCount: number;
}

const PAGE_SIZE = 10; // Tamanho fixo da página

const fetchStudents = async (tenantId: string, filters: StudentFilters, page: number): Promise<PaginatedStudents> => {
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('students')
    .select(`id, full_name, registration_code, status, phone, classes (name)`, { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (filters.name) {
    query = query.ilike('full_name', `%${filters.name}%`);
  }
  if (filters.registrationCode) {
    query = query.ilike('registration_code', `%${filters.registrationCode}%`);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.classId && filters.classId !== 'all') {
    query = query.eq('class_id', filters.classId);
  }

  query = query.order('full_name', { ascending: true });
  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);
  return { data: data as unknown as Student[], totalCount: count ?? 0 };
};

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, school_year')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data as Class[];
};

const StudentsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<StudentFilters>({
    name: '',
    registrationCode: '',
    status: 'all',
    classId: 'all',
  });

  const { data: classes, isLoading: isLoadingClasses, error: classesError } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId,
  });

  const { data: paginatedStudents, isLoading: isStudentsLoading, error } = useQuery<PaginatedStudents, Error>({
    queryKey: ['students', tenantId, filters, currentPage],
    queryFn: () => fetchStudents(tenantId!, filters, currentPage),
    enabled: !!tenantId,
  });
  
  const students = paginatedStudents?.data || [];
  const totalCount = paginatedStudents?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterChange = (key: keyof StudentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Resetar para a primeira página ao aplicar filtros
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      registrationCode: '',
      status: 'all',
      classId: 'all',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.name !== '' || filters.registrationCode !== '' || filters.status !== 'all' || filters.classId !== 'all';
  }, [filters]);

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  if (isProfileLoading || isLoadingClasses) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar alunos: {error.message}</div>;
  }

  if (classesError) {
    return <div className="text-destructive">Erro ao carregar turmas para filtro: {classesError.message}</div>;
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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterName">Nome do Aluno</Label>
              <Input
                id="filterName"
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterRegistrationCode">Matrícula</Label>
              <Input
                id="filterRegistrationCode"
                placeholder="Buscar por matrícula..."
                value={filters.registrationCode}
                onChange={(e) => handleFilterChange('registrationCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterStatus">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="filterStatus">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pre-enrolled">Pré-Matriculado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterClass">Turma</Label>
              <Select
                value={filters.classId}
                onValueChange={(value) => handleFilterChange('classId', value)}
                disabled={isLoadingClasses || (classes && classes.length === 0)}
              >
                <SelectTrigger id="filterClass">
                  <SelectValue placeholder="Todas as Turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Turmas</SelectItem>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.school_year})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!classes || classes.length === 0) && !isLoadingClasses && (
                <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma turma cadastrada.
                </p>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                <XCircle className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos ({totalCount} {totalCount === 1 ? 'aluno' : 'alunos'})</CardTitle>
        </CardHeader>
        <CardContent>
          {isStudentsLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-xs text-muted-foreground font-mono max-w-[100px] truncate">{student.id}</TableCell>
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
          )}
          
          {students.length === 0 && !isStudentsLoading && (
            <p className="text-center py-8 text-muted-foreground">Nenhum aluno cadastrado ou encontrado com os filtros aplicados.</p>
          )}

          {/* Controles de Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isStudentsLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isStudentsLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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