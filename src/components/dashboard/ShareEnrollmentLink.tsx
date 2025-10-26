import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareEnrollmentLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

// NOTE: In a real application, the base URL should be dynamically determined (e.g., via environment variables).
// For this environment, we assume the public link is accessible via the root URL /pre-matricula.
const PUBLIC_ENROLLMENT_PATH = "/pre-matricula";

const ShareEnrollmentLink: React.FC<ShareEnrollmentLinkProps> = ({
  isOpen,
  onClose,
}) => {
  const [link, setLink] = useState("");

  // Simulate generating the full public link
  const generateLink = () => {
    // In a real scenario, you might append a tenant identifier here:
    // const fullLink = `${window.location.origin}${PUBLIC_ENROLLMENT_PATH}?tenantId=${tenantId}`;
    const fullLink = `${window.location.origin}${PUBLIC_ENROLLMENT_PATH}`;
    setLink(fullLink);
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (isOpen && !link) {
    generateLink();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Formulário de Pré-Matrícula
          </DialogTitle>
          <DialogDescription>
            Use este link para permitir que novos alunos ou responsáveis iniciem o
            processo de matrícula de forma externa.
          </DialogDescription>
        </DialogHeader>
        <div className="flex space-x-2">
          <Input readOnly value={link} className="flex-1" />
          <Button type="button" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copiar Link</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Os dados preenchidos serão salvos na sua seção de Secretaria com o status "Pré-Matriculado".
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShareEnrollmentLink;