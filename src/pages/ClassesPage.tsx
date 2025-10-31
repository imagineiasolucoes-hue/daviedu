import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddClassSheet from '@/components/classes/AddClassSheet';
import { BookOpen, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Class {
  id: string;
  name: string;
  school_year: number;
  period: string;
  room: string | null;
  courses: { name: string } | null;
}

const fetchClasses = async (tenantId: string): Promise<Class[]> => {
  const { data, error } = await supabase
    .from('classes')
    .select(`id, name, school_year, period, room, courses (name)`)
    .eq('tenant_id', tenantId)
    .order('school_year', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as unknown as Class[];
};

const ClassesPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const { data: classes, isLoading: isClassesLoading, error } = useQuery<Class[], Error>({
    queryKey: ['classes', tenantId],
    queryFn: () => fetchClasses(tenantId!),
    enabled: !!tenantId,
  });

  if (isProfileLoading || isClassesLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar turmas: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Turmas</h1>
        <AddClassSheet />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lista de Turmas ({classes?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Curso/Série</TableHead>
                  <TableHead>Ano Letivo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.courses?.name || 'N/A'}</TableCell>
                    <TableCell>{classItem.school_year}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{classItem.period}</Badge>
                    </TableCell>
                    <TableCell>{classItem.room || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {/* Placeholder para Ações */}
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {classes?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma turma cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassesPage;