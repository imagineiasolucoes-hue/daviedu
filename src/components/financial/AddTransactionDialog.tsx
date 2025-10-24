import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { showError, showSuccess } from "@/utils/toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
}

const transactionSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  description: z.string().optional(),
  // Expense fields
  typeId: z.string().optional(),
  categoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  // Income field
  incomeCategoryId: z.string().optional(),
}).refine(data => {
    if (data.typeId) { // Assuming this is for an expense
        return !!data.typeId;
    }
    if (data.incomeCategoryId) { // Assuming this is for income
        return !!data.incomeCategoryId;
    }
    return false;
}, {
    message: "A categoria é obrigatória.",
    path: ["incomeCategoryId"], // Or appropriate path
});


const fetchCategories = async (tenantId: string | undefined, type: 'income' | 'expense', parentId?: string | null) => {
  if (!tenantId) return [];
  let query = supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("type", type);
  
  if (parentId === null) { // Top-level categories
    query = query.is("parent_id", null);
  } else if (parentId) { // Child categories
    query = query.eq("parent_id", parentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};

const fetchTenantId = async (userId: string | undefined) => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({ open, onOpenChange, type }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentForNewCategory, setParentForNewCategory] = useState<string | null | undefined>(undefined);

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { date: new Date() },
  });

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  // Watch form fields to trigger dependent queries
  const typeId = form.watch("typeId");
  const categoryId = form.watch("categoryId");

  // Queries for expense categories
  const { data: types = [] } = useQuery({
    queryKey: ["categories", tenantId, "expense", null],
    queryFn: () => fetchCategories(tenantId, "expense", null),
    enabled: !!tenantId && type === "expense",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", tenantId, "expense", typeId],
    queryFn: () => fetchCategories(tenantId, "expense", typeId),
    enabled: !!tenantId && !!typeId && type === "expense",
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ["categories", tenantId, "expense", categoryId],
    queryFn: () => fetchCategories(tenantId, "expense", categoryId),
    enabled: !!tenantId && !!categoryId && type === "expense",
  });

  // Query for income categories
  const { data: incomeCategories = [] } = useQuery({
    queryKey: ["categories", tenantId, "income", null],
    queryFn: () => fetchCategories(tenantId, "income", null),
    enabled: !!tenantId && type === "income",
  });

  // Reset dependent fields when a parent changes
  useEffect(() => { form.resetField("categoryId"); form.resetField("subCategoryId"); }, [typeId, form]);
  useEffect(() => { form.resetField("subCategoryId"); }, [categoryId, form]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || parentForNewCategory === undefined) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName,
          type,
          tenant_id: tenantId,
          parent_id: parentForNewCategory,
        })
        .select('id, name')
        .single();
      if (error) throw error;
      
      showSuccess(`Categoria "${newCategoryName}" criada.`);
      queryClient.invalidateQueries({ queryKey: ["categories", tenantId, type] });
      
      // Set the new category in the form
      if (parentForNewCategory === null) {
        if (type === 'income') form.setValue('incomeCategoryId', data.id);
        else form.setValue('typeId', data.id);
      } else if (parentForNewCategory === typeId) {
        form.setValue('categoryId', data.id);
      } else {
        form.setValue('subCategoryId', data.id);
      }

      setNewCategoryName("");
      setParentForNewCategory(undefined);
    } catch (error: any) {
      showError(error.message || "Falha ao criar categoria.");
    }
  };

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!user || !tenantId) return;
    
    const finalCategoryId = values.subCategoryId || values.categoryId || values.typeId || values.incomeCategoryId;
    if (!finalCategoryId) {
        showError("Por favor, selecione uma categoria.");
        return;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        date: values.date,
        amount: values.amount,
        description: values.description,
        category_id: finalCategoryId,
        type,
        tenant_id: tenantId,
        user_id: user.id,
      });

      if (error) throw error;

      showSuccess(`Transação registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao registrar a transação.");
    }
  };

  const renderCategoryCreator = (parentId: string | null, placeholder: string) => (
    <div className="flex items-center space-x-2 mt-2">
        <Input 
            placeholder={placeholder}
            value={newCategoryName}
            onChange={(e) => {
                setNewCategoryName(e.target.value);
                setParentForNewCategory(parentId);
            }}
        />
        <Button type="button" size="icon" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
            <PlusCircle className="h-4 w-4" />
        </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{type === 'income' ? 'Registrar Nova Receita' : 'Registrar Nova Despesa'}</DialogTitle>
          <DialogDescription>Preencha os detalhes da transação abaixo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl><Input type="number" placeholder="R$ 0,00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>

            {type === 'expense' && (
              <>
                <FormField control={form.control} name="typeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {renderCategoryCreator(null, "Novo tipo...")}
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!typeId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {typeId && renderCategoryCreator(typeId, "Nova categoria...")}
                      <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="subCategoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!categoryId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a subcategoria" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {subCategories.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {categoryId && renderCategoryCreator(categoryId, "Nova subcategoria...")}
                      <FormMessage />
                    </FormItem>
                )}/>
              </>
            )}

            {type === 'income' && (
                <FormField control={form.control} name="incomeCategoryId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria da Receita</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {incomeCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {renderCategoryCreator(null, "Nova categoria de receita...")}
                      <FormMessage />
                    </FormItem>
                )}/>
            )}

            <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Detalhes da transação..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
            )}/>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};