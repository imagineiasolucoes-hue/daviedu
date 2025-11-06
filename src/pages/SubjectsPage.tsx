import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookMarked, Loader2 } from 'lucide-react';
import SubjectSheet from '@/components/subjects/SubjectSheet';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// A busca de matérias é feita dentro do SubjectSheet, mas mantemos a interface para referência.
interface Subject {
  id: string;
  name: string;
}

const SubjectsPage: React.FC = () => {
  // Não precisamos de useQuery aqui, pois o SubjectSheet gerencia o estado.
  const { isLoading: isProfileLoading } = useProfile();

  if (isProfileLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Matérias</h1>
        {/* O SubjectSheet é o ponto de entrada para a gestão */}
        <SubjectSheet />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            Matérias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Clique no botão "Gerenciar Matérias" para adicionar, editar ou remover as matérias lecionadas na sua escola.
          </p>
          <p className="text-sm text-muted-foreground">
            As matérias cadastradas aqui serão usadas para vincular professores e lançar notas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubjectsPage;