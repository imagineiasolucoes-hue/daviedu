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
import { Category, CategoryType } from "@/types/financial";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionType: CategoryType; // Renamed from 'type' to avoid conflict with CategoryType
}

const transactionSchema = z.object({
  date: z.date({ required_error: "A data é obrigatória." }),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
  category_id: z.string().min(1, "A categoria é obrigatória."), // Now stores the ID of the subcategory
  description: z.string().optional(),
});

const fetchTenantId = async (userId: string | undefined) => {
    if (!userId) return undefined;
    const { data, error } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (error) throw new Error("Failed to fetch tenant ID");
    return data?.tenant_id;
};

const fetchCategories = async (tenantId: string | undefined, type: CategoryType, parentId: string | null = null): Promise<Category[]> => {
  if (!tenantId) return [];
  let query = supabase
    .from("categories")
    .select("id, name, parent_id, type")
    .eq("tenant_id", tenantId)
    .eq("type", type);

  if (parentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Category[];
};

export const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({ open, onOpenChange, transactionType }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [selectedType, setSelectedType] = useState<string | null>(null); // For expense types (e.g., 'Operacional')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // For expense categories (e.g., 'Material Escolar')

  const { data: tenantId } = useQuery({
    queryKey: ['tenantId', user?.id],
    queryFn: () => fetchTenantId(user?.id),
    enabled: !!user,
  });

  // Fetch top-level categories (Types for expenses, main types for income)
  const { data: topLevelCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", tenantId, transactionType, null],
    queryFn: () => fetchCategories(tenantId, transactionType, null),
    enabled: !!tenantId,
  });

  // Fetch second-level categories (Categories for expenses)
  const { data: secondLevelCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", tenantId, transactionType, selectedType],
    queryFn: () => fetchCategories(tenantId, transactionType, selectedType),
    enabled: !!tenantId && !!selectedType && transactionType === 'expense',
  });

  // Fetch third-level categories (Subcategories for expenses)
  const { data: thirdLevelCategories = [] } = useQuery<Category[]>({
    queryKey: ["categories", tenantId, transactionType, selectedCategory],
    queryFn: () => fetchCategories(tenantId, transactionType, selectedCategory),
    enabled: !!tenantId && !!selectedCategory && transactionType === 'expense',
  });

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      category_id: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedType(null);
      setSelectedCategory(null);
      setSearchValue("");
    }
  }, [open, form]);

  const { isSubmitting } = form.formState;

  const title = transactionType === "income" ? "Registrar Nova Receita" : "Registrar Nova Despesa";
  const description = transactionType === "income" ? "Adicione uma nova entrada de receita." : "Adicione uma nova saída de despesa.";

  const onSubmit = async (values: z.infer<typeof transactionSchema>) => {
    if (!user || !tenantId) {
      showError("Você precisa estar logado para realizar esta ação.");
      return;
    }

    try {
      const { category_id, ...restOfValues } = values;
      let finalCategoryId = category_id;

      // Determine which category list to check against based on the current selection level
      const currentCategoriesList = transactionType === 'income'
        ? topLevelCategories
        : (selectedCategory ? thirdLevelCategories : (selectedType ? secondLevelCategories : topLevelCategories));

      // If the category_id is actually a new category name (from search input)
      if (!currentCategoriesList.some(c => c.id === category_id)) { // Fix: Use currentCategoriesList
        let parentIdToUse: string | null = null;
        if (transactionType === 'expense') {
          if (selectedCategory) {
            parentIdToUse = selectedCategory; // New subcategory
          } else if (selectedType) {
            parentIdToUse = selectedType; // New category
          }
        }

        const { data: newCategory, error: categoryError } = await supabase
          .from('categories')
          .insert({ name: category_id, type: transactionType, tenant_id: tenantId, parent_id: parentIdToUse })
          .select('id')
          .single();

        if (categoryError) throw new Error("Falha ao criar nova categoria.");
        finalCategoryId = newCategory.id;
      }

      const { error: insertError } = await supabase.from("transactions").insert({
        ...restOfValues,
        category_id: finalCategoryId,
        type: transactionType,
        tenant_id: tenantId,
        user_id: user.id,
      });

      if (insertError) throw insertError;

      showSuccess(`Transação registrada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      showError(error.message || "Ocorreu um erro ao registrar a transação.");
    }
  };

  const categoriesToDisplay = transactionType === 'income'
    ? topLevelCategories
    : (selectedCategory ? thirdLevelCategories : (selectedType ? secondLevelCategories : topLevelCategories));

  const currentSelectedCategoryName = form.watch("category_id")
    ? categoriesToDisplay.find(cat => cat.id === form.watch("category_id"))?.name || form.watch("category_id")
    : "";

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

            {/* Income Categories */}
            {transactionType === 'income' && (
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tipo de Receita</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
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
                              ? topLevelCategories.find((cat) => cat.id === field.value)?.name
                              : "Selecione um tipo"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar tipo..." />
                          <CommandList>
                            <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                            <CommandGroup>
                              {topLevelCategories.map((cat) => (
                                <CommandItem
                                  value={cat.name}
                                  key={cat.id}
                                  onSelect={() => {
                                    form.setValue("category_id", cat.id);
                                    setComboboxOpen(false);
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

            {/* Expense Categories (Hierarchical) */}
            {transactionType === 'expense' && (
              <>
                <FormItem className="flex flex-col">
                  <FormLabel>Tipo de Despesa</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !selectedType && "text-muted-foreground"
                          )}
                        >
                          {selectedType
                            ? topLevelCategories.find((cat) => cat.id === selectedType)?.name
                            : "Selecione um tipo"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar tipo..." />
                        <CommandList>
                          <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                          <CommandGroup>
                            {topLevelCategories.map((cat) => (
                              <CommandItem
                                value={cat.name}
                                key={cat.id}
                                onSelect={() => {
                                  setSelectedType(cat.id);
                                  setSelectedCategory(null); // Reset category and subcategory
                                  form.setValue("category_id", "");
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedType === cat.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cat.name}
                              </CommandItem>
                            ))}
                            {searchValue && !topLevelCategories.some(c => c.name.toLowerCase() === searchValue.toLowerCase()) && (
                              <CommandItem
                                onSelect={() => {
                                  setSelectedType(searchValue); // Temporarily set search value as selected type
                                  setSelectedCategory(null);
                                  form.setValue("category_id", searchValue); // Use search value as category_id for creation
                                  setComboboxOpen(false);
                                }}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Criar "{searchValue}" como Tipo
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>

                {selectedType && (
                  <FormItem className="flex flex-col">
                    <FormLabel>Categoria</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !selectedCategory && "text-muted-foreground"
                            )}
                          >
                            {selectedCategory
                              ? secondLevelCategories.find((cat) => cat.id === selectedCategory)?.name
                              : "Selecione uma categoria"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar categoria..." onValueChange={setSearchValue} />
                          <CommandList>
                            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
                            <CommandGroup>
                              {secondLevelCategories.map((cat) => (
                                <CommandItem
                                  value={cat.name}
                                  key={cat.id}
                                  onSelect={() => {
                                    setSelectedCategory(cat.id);
                                    form.setValue("category_id", ""); // Reset subcategory
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCategory === cat.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {cat.name}
                                </CommandItem>
                              ))}
                              {searchValue && !secondLevelCategories.some(c => c.name.toLowerCase() === searchValue.toLowerCase()) && (
                                <CommandItem
                                  onSelect={() => {
                                    setSelectedCategory(searchValue); // Temporarily set search value as selected category
                                    form.setValue("category_id", searchValue); // Use search value as category_id for creation
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Criar "{searchValue}" como Categoria
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}

                {selectedCategory && (
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Subcategoria</FormLabel>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
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
                                  ? thirdLevelCategories.find((cat) => cat.id === field.value)?.name || field.value
                                  : "Selecione uma subcategoria"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar subcategoria..." onValueChange={setSearchValue} />
                              <CommandList>
                                <CommandEmpty>Nenhuma subcategoria encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {thirdLevelCategories.map((cat) => (
                                    <CommandItem
                                      value={cat.name}
                                      key={cat.id}
                                      onSelect={() => {
                                        form.setValue("category_id", cat.id);
                                        setComboboxOpen(false);
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
                                  {searchValue && !thirdLevelCategories.some(c => c.name.toLowerCase() === searchValue.toLowerCase()) && (
                                    <CommandItem
                                      onSelect={() => {
                                        form.setValue("category_id", searchValue); // Use search value as category_id for creation
                                        setComboboxOpen(false);
                                      }}
                                    >
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Criar "{searchValue}" como Subcategoria
                                    </CommandItem>
                                  )}
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
              </>
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