import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SchoolDocument } from '@/types/documents';
import { Loader2 } from 'lucide-react';

interface DocumentViewerDialogProps {
  document: SchoolDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({ document, open, onOpenChange }) => {
  const [isLoadingIframe, setIsLoadingIframe] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setIsLoadingIframe(true);
    }
  }, [open, document]);

  if (!document) {
    return null;
  }

  const getDocumentUrl = (doc: SchoolDocument) => {
    if (doc.file_url === 'generated_on_demand' && doc.related_entity_id) {
      // Constrói a URL para documentos gerados dinamicamente
      return `/documents/generate/${doc.document_type}/${doc.related_entity_id}`;
    }
    return doc.file_url;
  };

  const documentUrl = getDocumentUrl(document);
  const documentTitle = document.metadata?.description || document.description || 'Documento';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
          <DialogDescription>Visualizando o documento.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow relative">
          {isLoadingIframe && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {documentUrl ? (
            <iframe
              src={documentUrl}
              title={documentTitle}
              className="w-full h-full border-none"
              onLoad={() => setIsLoadingIframe(false)}
              onError={() => {
                setIsLoadingIframe(false);
                // TODO: Adicionar um toast de erro se o iframe não carregar
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Não foi possível carregar o documento.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerDialog;