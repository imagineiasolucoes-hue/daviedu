import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeletePayrollDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const DeletePayrollDialog: React.FC<DeletePayrollDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente este
            lançamento da folha de pagamento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Excluindo..." : "Sim, excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePayrollDialog;