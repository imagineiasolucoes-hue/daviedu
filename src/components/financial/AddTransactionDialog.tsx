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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
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
import { useState, useEffect } from "react";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
}

const transactionSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  mainCategory: z.string().min(1, "A categoria principal é obrigatória."),
  subCategory: z.string().optional(), // Only for expenses
  description: z.string().optional(),
});

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'income' | 'expense';
}

const fetchCategories = async (tenantId: string | undefined, type: 'income' | 'expense'): Promise<Category[]> => {
  if (!tenantId) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, parent_id, type")
    .eq("tenant_id", tenantId)
    .eq("type", type);
  if (error) throw new Error(error.message);
  return data as Category[];
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
  const [mainCategoryComboboxOpen, setMainCategoryComboboxOpen] = useState(false);
  const [subCategoryComboboxOpen, setSubCategoryComboboxOpen] = useState(false);
  const [mainCategorySearchValue, setMainCategorySearchValue] = useState("");
  const [subCategorySearchValue, setSubCategorySearchValue] = useState("");

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories", tenantId, type],
    queryFn: () => fetchCategories(tenantId, type),
    enabled: !!tenantId,
  });

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      mainCategory: "",
      subCategory: "",
      description: "",
    },
  });

  const { isSubmitting } = form.formState;
  const { watch, setValue } = form; // Corrected: watch and setValue are from form directly
  const selectedMainCategory = watch("mainCategory");

  // Reset subCategory when mainCategory changes
  useEffect(() => {
    setValue("subCategory", "");
  }, [selectedMainCategory, setValue]);

  const mainCategories = allCategories.filter(cat => cat.parent_id === null);
  const subCategories = allCategories.filter(cat => cat.parent_id === selectedMainCategory);

  const title = type === "income" ? "Registrar Nova Receita" : "Registrar Nova Despesa";
  const description = type === "income" ? "Adicione uma nova entrada de receita." : "Adicione uma nova saída de despesa.";

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!user || !tenantId) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }

    try {
      let finalCategoryId = values.mainCategory;

      // If it's an expense and a subcategory is selected/created
      if (type === 'expense' && values.subCategory) {
        const existingSubCategory = subCategories.find(c => c.id === values.subCategory || c.name.toLowerCase() === values.subCategory.toLowerCase());
        if (existingSubCategory) {
          finalCategoryId = existingSubCategory.id;
        } else {
          // Create new subcategory
          const { data: newSubCategory, error: subCategoryError } = await supabase
            .from('categories')
            .insert({ name: values.subCategory, type, tenant_id: tenantId, parent_id: values.mainCategory })
            .select('id')
            .single();
          if (subCategoryError) throw new Error("Falha ao criar nova subcategoria.");
          finalCategoryId = newSubCategory.id;
        }
      } else if (type === 'expense' && values.mainCategory) {
        // If it's an expense and only a main category is selected/created
        const existingMainCategory = mainCategories.find(c => c.id === values.mainCategory || c.name.toLowerCase() === values.mainCategory.toLowerCase());
        if (!existingMainCategory) {
          // Create new main category if it doesn't exist
          const { data: newMainCategory, error: mainCategoryError } = await supabase
            .from('categories')
            .insert({ name: values.mainCategory, type, tenant_id: tenantId, parent_id: null })
            .select('id')
            .single();
          if (mainCategoryError) throw new Error("Falha ao criar nova categoria principal.");
          finalCategoryId = newMainCategory.id;
        }
      } else if (type === 'income' && values.mainCategory) {
        // For income, mainCategory is the final category
        const existingIncomeCategory = mainCategories.find(c => c.id === values.mainCategory || c.name.toLowerCase() === values.mainCategory.toLowerCase());
        if (!existingIncomeCategory) {
          // This case should ideally not happen if income categories are fixed, but as a fallback
          const { data: newIncomeCategory, error: incomeCategoryError } = await supabase
            .from('categories')
            .insert({ name: values.mainCategory, type, tenant_id: tenantId, parent_id: null })
            .select('id')
            .single();
          if (incomeCategoryError) throw new Error("Falha ao criar nova categoria de receita.");
          finalCategoryId = newIncomeCategory.id;
        }
      }


      const { error: insertError } = await supabase.from("transactions").insert({
        amount: values.amount,
        date: values.date.toISOString().split('T')[0], // Format date to YYYY-MM-DD
        category_id: finalCategoryId,
        type,
        tenant_id: tenantId,
        user_id: user.id,
        description: values.description,
      });

      if (insertError) throw insertError;

      showSuccess(`Transação registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] }); // Invalidate categories to refresh lists
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao registrar a transação.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="R$ 0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Main Category Field */}
            <FormField
              control={form.control}
              name="mainCategory"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{type === 'income' ? 'Tipo de Receita' : 'Categoria Principal'}</FormLabel>
                  <Popover open={mainCategoryComboboxOpen} onOpenChange={setMainCategoryComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? mainCategories.find((cat) => cat.id === field.value)?.name || field.value
                            : `Selecione ${type === 'income' ? 'um tipo' : 'uma categoria'}`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder={`Procurar ou criar ${type === 'income' ? 'tipo' : 'categoria'}...`}
                          onValueChange={setMainCategorySearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                          <CommandGroup>
                            {type === 'expense' && mainCategorySearchValue && !mainCategories.some(c => c.name.toLowerCase() === mainCategorySearchValue.toLowerCase()) && (
                              <CommandItem
                                onSelect={() => {
                                  setValue("mainCategory", mainCategorySearchValue);
                                  setMainCategoryComboboxOpen(false);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Criar "{mainCategorySearchValue}"
                              </CommandItem>
                            )}
                            {mainCategories.map((cat) => (
                              <CommandItem
                                value={cat.name}
                                key={cat.id}
                                onSelect={() => {
                                  setValue("mainCategory", cat.id);
                                  setMainCategoryComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === cat.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cat.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategory Field (only for expenses and if a main category is selected) */}
            {type === 'expense' && selectedMainCategory && (
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subcategoria (Opcional)</FormLabel>
                    <Popover open={subCategoryComboboxOpen} onOpenChange={setSubCategoryComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!selectedMainCategory}
                          >
                            {field.value
                              ? subCategories.find((cat) => cat.id === field.value)?.name || field.value
                              : "Selecione ou crie uma subcategoria"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Procurar ou criar subcategoria..."
                            onValueChange={setSubCategorySearchValue}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhuma subcategoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {subCategorySearchValue && !subCategories.some(c => c.name.toLowerCase() === subCategorySearchValue.toLowerCase()) && (
                                <CommandItem
                                  onSelect={() => {
                                    setValue("subCategory", subCategorySearchValue);
                                    setSubCategoryComboboxOpen(false);
                                  }}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Criar "{subCategorySearchValue}"
                                </CommandItem>
                              )}
                              {subCategories.map((cat) => (
                                <CommandItem
                                  value={cat.name}
                                  key={cat.id}
                                  onSelect={() => {
                                    setValue("subCategory", cat.id);
                                    setSubCategoryComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === cat.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {cat.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes da transação..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};