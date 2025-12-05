import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Tipos e Schemas ---
const extendTrialSchema = z.object({
  days_to_add: z.coerce.number().min(1, "O número de dias deve ser maior que zero.").max(365, "Máximo de 365 dias por extensão."),
});

type ExtendTrialFormData = z.infer<typeof extendTrialSchema>;

interface ExtendTrialDialogProps {
  tenantId: string | null;
  tenantName: string | null;
  currentExpiration: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ExtendTrialDialog: React.FC<ExtendTrialDialogProps> = ({ tenantId, tenantName, currentExpiration, open, onOpenChange }) => {
  const queryClient = useQueryClient();

  const form = useForm<ExtendTrialFormData>({
    resolver: zodResolver(extendTrialSchema),
    defaultValues: {
      days_to_add: 7,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ExtendTrialFormData) => {
      if (!tenantId) throw new Error("ID da escola ausente.");
      
      const { error, data: edgeFunctionData } = await supabase.functions.invoke('extend-tenant-trial', {
        body: JSON.stringify({ tenant_id: tenantId, days_to_add: data.days_to_add }),
      });

      if (error) throw new Error(error.message);
      if (edgeFunctionData.error) throw new Error(edgeFunctionData.error);
      
      return edgeFunctionData.newExpirationDate;
    },
    onSuccess: (newExpirationDate) => {
      const formattedDate = format(parseISO(newExpirationDate), "dd/MM/yyyy", { locale: ptBR });
      toast.success("Período de Teste Estendido!", {
        description: `O teste de ${tenantName} agora expira em ${formattedDate}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      onOpenChange(false);
      form.reset({ days_to_add: 7 });
    },
    onError: (error) => {
      toast.error("Erro ao Estender Teste", { description: error.message });
    },
  });

  const onSubmit = (data: ExtendTrialFormData) => {
    mutation.mutate(data);
  };

  const formattedCurrentExpiration = currentExpiration 
    ? format(parseISO(currentExpiration), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : 'N/A (Inicia hoje)';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Estender Teste Grátis
          </AlertDialogTitle>
          <AlertDialogDescription>
            Adicione mais dias de teste para a escola <strong>{tenantName}</strong>.
            <p className="mt-2 text-sm text-muted-foreground">
                Expiração atual: <span className="font-semibold">{formattedCurrentExpiration}</span>
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="days_to_add">Dias a Adicionar</Label>
                <Input 
                    id="days_to_add" 
                    type="number" 
                    min={1}
                    max={365}
                    placeholder="Ex: 7" 
                    {...form.register("days_to_add", { valueAsNumber: true })} 
                />
                {form.formState.errors.days_to_add && <p className="text-sm text-destructive">{form.formState.errors.days_to_add.message}</p>}
            </div>
        
            <AlertDialogFooter>
                <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
                <Button
                    type="submit"
                    disabled={mutation.isPending}
                >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar Extensão
                </Button>
            </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExtendTrialDialog;