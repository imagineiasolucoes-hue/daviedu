import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, FileUp, FileText, User, GraduationCap, X } from 'lucide-react'; // 'X' adicionado aqui
import { Separator } from '@/components/ui/separator';

// --- Tipos e Schemas ---
const documentTypeEnum = z.enum(['contract', 'receipt', 'report_card', 'transcript', 'payslip', 'other']);

const addDocumentSchema = z.object({
  document_type: documentTypeEnum,
  description: z.string().min(5, "A descrição é obrigatória e deve ter pelo menos 5 caracteres."),
  file: z.instanceof(File, { message: "Um arquivo é obrigatório." }),
  related_entity_type: z.enum(['student', 'employee', 'none']).default('none'),
  related_entity_id: z.string().uuid("Selecione uma entidade relacionada.").optional().nullable(),
});

type AddDocumentFormData = z.infer<typeof addDocumentSchema>;

interface Employee {
  id: string;
  full_name: string;
}

interface Student {
  id: string;
  full_name: string;
  registration_code: string;
}

// --- Funções de Busca de Dados ---
const fetchEmployees = async (tenantId: string): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const fetchStudents = async (tenantId: string): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, registration_code')
    .eq('tenant_id', tenantId)
    .order('full_name');
  if (error) throw new Error(error.message);
  return data;
};

const AddDocumentSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddDocumentFormData>({
    resolver: zodResolver(addDocumentSchema),
    defaultValues: {
      document_type: 'other',
      description: '',
      related_entity_type: 'none',
      related_entity_id: null,
    },
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[], Error>({
    queryKey: ['employees', tenantId],
    queryFn: () => fetchEmployees(tenantId!),
    enabled: !!tenantId && isOpen && form.watch('related_entity_type') === 'employee',
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[], Error>({
    queryKey: ['students', tenantId],
    queryFn: () => fetchStudents(tenantId!),
    enabled: !!tenantId && isOpen && form.watch('related_entity_type') === 'student',
  });

  const relatedEntityType = form.watch('related_entity_type');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('file', file);
      form.clearErrors('file');
    }
  };

  const onSubmit = async (data: AddDocumentFormData) => {
    if (!tenantId) {
      toast.error("Erro", { description: "ID da escola não encontrado." });
      return;
    }

    if (!data.file) {
      toast.error("Erro", { description: "Nenhum arquivo selecionado." });
      return;
    }

    const file = data.file;
    const fileExtension = file.name.split('.').pop();
    const fileName = `${data.document_type}-${Date.now()}.${fileExtension}`;
    const filePath = `${tenantId}/${data.document_type}/${fileName}`;

    try {
      // 1. Upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('school-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('school-documents')
        .getPublicUrl(filePath);

      // 2. Inserir os metadados do documento no banco de dados
      const documentData = {
        tenant_id: tenantId,
        document_type: data.document_type,
        file_url: publicUrl,
        description: data.description,
        generated_by: profile?.id, // Quem gerou/fez upload
        related_entity_id: data.related_entity_id === 'none' ? null : data.related_entity_id,
        metadata: {
          originalFileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          relatedEntityType: data.related_entity_type === 'none' ? null : data.related_entity_type,
        },
      };

      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentData);

      if (insertError) {
        // Se a inserção no DB falhar, tentar remover o arquivo do storage
        await supabase.storage.from('school-documents').remove([filePath]);
        throw new Error(`Erro ao registrar documento no banco de dados: ${insertError.message}`);
      }

      toast.success("Documento cadastrado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ['documents', tenantId] });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast.error("Erro ao Cadastrar Documento", {
        description: errorMessage,
      });
    }
  };

  const isLoading = isLoadingEmployees || isLoadingStudents;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Documento
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Cadastrar Novo Documento</SheetTitle>
          <SheetDescription>
            Faça o upload de um arquivo e adicione os detalhes do documento.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="document_type">Tipo de Documento</Label>
            <Select onValueChange={(value) => form.setValue('document_type', value as any)} value={form.watch('document_type')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="receipt">Recibo</SelectItem>
                <SelectItem value="report_card">Boletim</SelectItem>
                <SelectItem value="transcript">Histórico Escolar</SelectItem>
                <SelectItem value="payslip">Holerite</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.document_type && <p className="text-sm text-destructive">{form.formState.errors.document_type.message}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...form.register("description")} placeholder="Ex: Contrato de Matrícula 2024 - João Silva" />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          <Separator />

          {/* Upload de Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo (PDF)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-grow">
                <FileUp className="mr-2 h-4 w-4" />
                {form.watch('file')?.name || "Selecionar arquivo PDF"}
              </Button>
              {form.watch('file') && (
                <Button type="button" variant="ghost" size="icon" onClick={() => {
                  form.setValue('file', undefined as any); // Limpa o arquivo
                  if (fileInputRef.current) fileInputRef.current.value = ''; // Limpa o input file
                }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {form.formState.errors.file && <p className="text-sm text-destructive">{form.formState.errors.file.message}</p>}
          </div>

          <Separator />

          {/* Entidade Relacionada (Opcional) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vincular a uma Entidade (Opcional)</h3>
            <div className="space-y-2">
              <Label htmlFor="related_entity_type">Tipo de Entidade</Label>
              <Select onValueChange={(value) => {
                form.setValue('related_entity_type', value as any);
                form.setValue('related_entity_id', null); // Limpa o ID ao mudar o tipo
              }} value={relatedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="employee">Funcionário/Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {relatedEntityType !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="related_entity_id">
                  {relatedEntityType === 'student' ? "Aluno" : "Funcionário/Professor"}
                </Label>
                <Select 
                  onValueChange={(value) => form.setValue('related_entity_id', value === "none" ? null : value)} 
                  value={form.watch('related_entity_id') || 'none'}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Carregando..." : `Selecione um ${relatedEntityType === 'student' ? "aluno" : "funcionário"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {relatedEntityType === 'student' && students?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          {s.full_name} ({s.registration_code})
                        </div>
                      </SelectItem>
                    ))}
                    {relatedEntityType === 'employee' && employees?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {e.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.related_entity_id && <p className="text-sm text-destructive">{form.formState.errors.related_entity_id.message}</p>}
              </div>
            )}
          </div>

          <SheetFooter className="pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Documento
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddDocumentSheet;