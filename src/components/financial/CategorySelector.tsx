import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

interface CategorySelectorProps {
  form: UseFormReturn<any>;
  type: "income" | "expense";
  tenantId: string | undefined;
}

const fetchCategories = async (tenantId: string | undefined, type: "income" | "expense", parentId: string | null = null) => {
  if (!tenantId) return [];
  
  let query = supabase
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .eq("type", type);

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({ form, type, tenantId }) => {
  const [level1Id, setLevel1Id] = useState<string | null>(null);
  const [level2Id, setLevel2Id] = useState<string | null>(null);

  // Reset selections when the dialog is reset
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === undefined) { // form.reset() was called
        setLevel1Id(null);
        setLevel2Id(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const { data: level1Categories = [] } = useQuery({
    queryKey: ["categories", tenantId, type, null],
    queryFn: () => fetchCategories(tenantId, type, null),
    enabled: !!tenantId,
  });

  const { data: level2Categories = [] } = useQuery({
    queryKey: ["categories", tenantId, type, level1Id],
    queryFn: () => fetchCategories(tenantId, type, level1Id),
    enabled: !!tenantId && !!level1Id,
  });

  const { data: level3Categories = [] } = useQuery({
    queryKey: ["categories", tenantId, type, level2Id],
    queryFn: () => fetchCategories(tenantId, type, level2Id),
    enabled: !!tenantId && !!level2Id,
  });

  const handleLevel1Change = (value: string) => {
    setLevel1Id(value);
    setLevel2Id(null);
    form.setValue("category_id", ""); // Clear final selection
    if (type === 'income') {
        form.setValue("category_id", value);
    }
  };

  const handleLevel2Change = (value: string) => {
    setLevel2Id(value);
    form.setValue("category_id", ""); // Clear final selection
  };

  if (type === 'income') {
    return (
      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo de Receita</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {level1Categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>Tipo de Despesa</FormLabel>
        <Select onValueChange={handleLevel1Change}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {level1Categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormItem>

      {level1Id && level2Categories.length > 0 && (
        <FormItem>
          <FormLabel>Categoria</FormLabel>
          <Select onValueChange={handleLevel2Change}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {level2Categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}

      {level2Id && level3Categories.length > 0 && (
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoria</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a subcategoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {level3Categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
       {/* Hidden field to show validation error if final category is not selected */}
       <FormField
          control={form.control}
          name="category_id"
          render={() => <FormItem><FormMessage /></FormItem>}
        />
    </div>
  );
};