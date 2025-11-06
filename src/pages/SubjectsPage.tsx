import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Loader2 } from 'lucide-react';
import SubjectSheet from '@/components/subjects/SubjectSheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Subject {
  id: string;
  name: string;
}

const fetchSubjects = async (tenantId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return data;
};

const SubjectsPage: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const { data: subjects, isLoading: isLoadingSubjects, error } = useQuery<Subject[], Error>({
    queryKey: ['subjects', tenantId],
    queryFn: () => fetchSubjects(tenantId!),
    enabled: !!tenantId,
  });

  if (isProfileLoading || isLoadingSubjects) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="text-destructive">Erro ao carregar matérias: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Matérias</h1>
        {/* O SubjectSheet já contém o botão de adicionar e a lista de gestão */}
        <SubjectSheet />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            Matérias Cadastradas ({subjects?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Use o botão "Gerenciar Matérias" acima para adicionar ou remover matérias.
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Matéria</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects?.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono max-w-[100px] truncate">{subject.id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {subjects?.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Nenhuma matéria cadastrada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectsPage;