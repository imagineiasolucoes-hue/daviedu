import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { showSuccess } from "@/utils/toast";

const schoolInfoSchema = z.object({
  name: z.string().min(3, "O nome da escola é obrigatório."),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido."),
  address: z.string().optional(),
});

const SchoolInfoForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof schoolInfoSchema>>({
    resolver: zodResolver(schoolInfoSchema),
    // TODO: Fetch existing data from the database to populate defaultValues
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  function onSubmit(values: z.infer<typeof schoolInfoSchema>) {
    setIsLoading(true);
    console.log("School info submitted:", values);
    // TODO: Implement Supabase update logic here
    setTimeout(() => {
      showSuccess("Informações da escola salvas com sucesso!");
      setIsLoading(false);
    }, 1000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Escola</CardTitle>
        <CardDescription>Atualize os dados cadastrais da sua instituição de ensino.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Escola</FormLabel>
                  <FormControl>
                    <Input placeholder="Colégio Exemplo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0001-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contato@escola.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua Exemplo, 123, Bairro, Cidade - UF" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SchoolInfoForm;