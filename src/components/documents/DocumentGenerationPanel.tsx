import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, GraduationCap, ArrowRight, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
}

// Tipos de documentos dinâmicos que podemos gerar
type DynamicDocumentType = 'transcript' | 'report_card' | 'monthly_fee_collection';

const fetchStudents = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const DocumentGenerationPanel: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id;

  const [selectedDocumentType, setSelectedDocumentType] = useState<DynamicDocumentType | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | ''>('');

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[], Error>({
    queryKey: ['activeStudentsForDocs', tenantId],
    queryFn: () => fetchStudents(tenantId!),
    enabled: !!tenantId,
  });

  const handleGenerate = () => {
    if (!selectedDocumentType || !selectedStudentId) {
      toast.warning("Seleção Incompleta", { description: "Selecione o tipo de documento e o aluno." });
      return;
    }

    // Redireciona para a rota de visualização/impressão
    navigate(`/documents/generate/${selectedDocumentType}/${selectedStudentId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          Geração de Documentos Dinâmicos
        </CardTitle>
        <CardDescription>Gere documentos oficiais (Históricos, Boletins, Cobranças) a partir dos dados do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seleção do Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="document_type">Tipo de Documento</Label>
            <Select 
              onValueChange={(value: DynamicDocumentType) => setSelectedDocumentType(value)} 
              value={selectedDocumentType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transcript">Histórico Escolar</SelectItem>
                <SelectItem value="report_card">Boletim Escolar</SelectItem>
                <SelectItem value="monthly_fee_collection">Cobrança de Mensalidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleção do Aluno */}
          <div className="space-y-2">
            <Label htmlFor="student_id">Aluno</Label>
            <Select 
              onValueChange={setSelectedStudentId} 
              value={selectedStudentId}
              disabled={isLoadingStudents || !selectedDocumentType}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingStudents ? "Carregando Alunos..." : "Selecione o aluno"} />
              </SelectTrigger>
              <SelectContent>
                {students?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      {s.full_name} ({s.registration_code})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingStudents && <Loader2 className="h-4 w-4 animate-spin text-primary mt-2" />}
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!selectedDocumentType || !selectedStudentId}
          className="w-full mt-4"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Gerar Documento para Impressão
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentGenerationPanel;