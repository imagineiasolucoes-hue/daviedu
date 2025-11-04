import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SchoolDocument } from '@/types/documents'; // Importando a interface centralizada

interface DocumentTableProps {
  documents: SchoolDocument[];
  onView: (document: SchoolDocument) => void;
  onDelete: (document: SchoolDocument) => void;
}

const getDocumentTypeLabel = (type: SchoolDocument['document_type']) => {
  switch (type) {
    case 'contract': return 'Contrato';
    case 'receipt': return 'Recibo';
    case 'report_card': return 'Boletim';
    case 'transcript': return 'Histórico Escolar';
    case 'payslip': return 'Holerite';
    case 'other': return 'Outro';
    default: return 'Desconhecido';
  }
};

const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onView, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Gerado em</TableHead>
            <TableHead>Gerado por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Badge variant="secondary">{getDocumentTypeLabel(doc.document_type)}</Badge>
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {doc.metadata?.description || doc.description || 'N/A'}
                </TableCell>
                <TableCell>
                  {doc.generated_at ? format(new Date(doc.generated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                </TableCell>
                <TableCell>
                  {doc.generated_by_profile ? `${doc.generated_by_profile.first_name} ${doc.generated_by_profile.last_name}` : 'Sistema'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(doc)}>
                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(doc)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentTable;