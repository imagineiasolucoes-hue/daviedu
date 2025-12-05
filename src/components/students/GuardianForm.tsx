import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { z } from 'zod';

// Schema para o responsável (usado dentro do AddStudentSheet)
export const guardianSchema = z.object({
  guardian_full_name: z.string().min(5, "Nome completo do responsável é obrigatório."),
  guardian_relationship: z.enum(['Pai', 'Mãe', 'Avô(ó)', 'Tutor', 'Outro'], {
    required_error: "O parentesco é obrigatório.",
  }),
  guardian_phone: z.string().optional().nullable(),
  guardian_email: z.string().email("Email inválido.").optional().or(z.literal('')).nullable(),
  guardian_cpf: z.string().optional().nullable(),
});

export type GuardianFormData = z.infer<typeof guardianSchema>;

const GuardianForm: React.FC = () => {
  const { register, formState: { errors }, setValue, watch } = useFormContext<GuardianFormData>();

  // O valor do watch pode ser undefined ou um dos valores do enum.
  // Se for undefined, passamos uma string vazia para o Select, que é mais seguro.
  const relationshipValue = watch('guardian_relationship');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Responsável Legal Principal</h3>
      
      <div className="space-y-2">
        <Label htmlFor="guardian_full_name">Nome Completo do Responsável</Label>
        <Input id="guardian_full_name" {...register("guardian_full_name")} />
        {errors.guardian_full_name && <p className="text-sm text-destructive">{errors.guardian_full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guardian_relationship">Parentesco</Label>
          <Select 
            onValueChange={(value) => setValue('guardian_relationship', value as any, { shouldValidate: true })} 
            value={relationshipValue || ''} // Garante que o valor seja uma string (ou '')
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o parentesco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pai">Pai</SelectItem>
              <SelectItem value="Mãe">Mãe</SelectItem>
              <SelectItem value="Avô(ó)">Avô(ó)</SelectItem>
              <SelectItem value="Tutor">Tutor</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.guardian_relationship && <p className="text-sm text-destructive">{errors.guardian_relationship.message?.toString()}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_phone">Telefone (Opcional)</Label>
          <Input id="guardian_phone" type="tel" {...register("guardian_phone")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guardian_email">Email (Opcional)</Label>
          <Input id="guardian_email" type="email" {...register("guardian_email")} />
          {errors.guardian_email && <p className="text-sm text-destructive">{errors.guardian_email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian_cpf">CPF (Opcional)</Label>
          <Input id="guardian_cpf" {...register("guardian_cpf")} />
        </div>
      </div>
      <Separator />
    </div>
  );
};

export default GuardianForm;