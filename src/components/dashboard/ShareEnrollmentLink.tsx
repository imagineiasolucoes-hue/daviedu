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
import { Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchTenantId } from "@/lib/tenant";

interface ShareEnrollmentLinkProps {
  isOpen: boolean;
  onClose: () => void;
}

const PUBLIC_ENROLLMENT_PATH = "/pre-matricula";

const ShareEnrollmentLink: React.FC<ShareEnrollmentLinkProps> = ({
  isOpen,
  onClose,
}) => {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const generateLink = async () => {
        try {
          const { tenantId, error } = await fetchTenantId();
          if (error || !tenantId) {
            throw new Error(error || "Não foi possível obter o ID da escola.");
          }
          const fullLink = `${window.location.origin}${PUBLIC_ENROLLMENT_PATH}?tenant_id=${tenantId}`;
          setLink(fullLink);
        } catch (err: any) {
          toast.error(`Erro ao gerar link: ${err.message}`);
          setLink("Erro ao gerar o link.");
        } finally {
          setIsLoading(false);
        }
      };
      generateLink();
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (link && !isLoading && !link.startsWith("Erro")) {
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
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-10 rounded-md border bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <Input readOnly value={link} className="flex-1" />
              <Button type="button" size="icon" onClick={handleCopy} disabled={link.startsWith("Erro")}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copiar Link</span>
              </Button>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Os dados preenchidos serão salvos na sua seção de Secretaria com o status "Pré-Matriculado".
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default ShareEnrollmentLink;