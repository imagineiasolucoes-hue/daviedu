import { useState, useEffect } from "react";
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
import { useTenant } from "@/hooks/useTenant";

interface ShareEnrollmentLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

const PUBLIC_ENROLLMENT_PATH = "/pre-matricula";

const ShareEnrollmentLink: React.FC<ShareEnrollmentLinkProps> = ({
  isOpen,
  onClose,
}) => {
  const { tenantId } = useTenant();
  const [link, setLink] = useState("");

  useEffect(() => {
    if (isOpen && tenantId) {
      const fullLink = `${window.location.origin}${PUBLIC_ENROLLMENT_PATH}?tenant_id=${tenantId}`;
      setLink(fullLink);
    }
  }, [isOpen, tenantId]);

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Formulário de Pré-Matrícula
          </DialogTitle>
          <DialogDescription>
            Use este link exclusivo da sua escola para permitir que novos alunos ou responsáveis iniciem o processo de matrícula.
          </DialogDescription>
        </DialogHeader>
        <div className="flex space-x-2">
          <Input readOnly value={link} className="flex-1" />
          <Button type="button" size="icon" onClick={handleCopy} disabled={!link}>
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