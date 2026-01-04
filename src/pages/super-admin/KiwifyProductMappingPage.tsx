import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Loader2, PlusCircle, Edit, Trash2, Link as LinkIcon, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Navigate } from 'react-router-dom';

interface KiwifyProduct {
  id: string;
  kiwify_product_id: string;
  course_id: string;
  name: string;
  courses: { name: string } | null; // Para exibir o nome do curso
}

interface Course {
  id: string;
  name: string;
}

const KiwifyProductMappingPage: React.FC = () => {
  const { isSuperAdmin, isLoading: isProfileLoading } = useProfile();
  const [kiwifyProducts, setKiwifyProducts] = useState<KiwifyProduct[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<KiwifyProduct | null>(null);
  const [form, setForm] = useState({
    kiwify_product_id: '',
    course_id: '',
    name: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: productsData, error: productsError } = await supabase
      .from('kiwify_products')
      .select('*, courses(name)');

    if (productsError) {
      toast.error("Erro ao carregar mapeamentos Kiwify: " + productsError.message);
    } else {
      setKiwifyProducts(productsData || []);
    }

    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, name');

    if (coursesError) {
      toast.error("Erro ao carregar cursos: " + coursesError.message);
    } else {
      setCourses(coursesData || []);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProduct = async () => {
    if (!form.kiwify_product_id || !form.course_id || !form.name) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    let error = null;
    if (currentProduct) {
      // Update
      const { error: updateError } = await supabase
        .from('kiwify_products')
        .update(form)
        .eq('id', currentProduct.id);
      error = updateError;
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('kiwify_products')
        .insert(form);
      error = insertError;
    }

    if (error) {
      toast.error("Erro ao salvar mapeamento: " + error.message);
    } else {
      toast.success("Mapeamento salvo com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este mapeamento?")) return;

    const { error } = await supabase
      .from('kiwify_products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir mapeamento: " + error.message);
    } else {
      toast.success("Mapeamento excluído com sucesso!");
      fetchData();
    }
  };

  const resetForm = () => {
    setForm({ kiwify_product_id: '', course_id: '', name: '' });
    setCurrentProduct(null);
  };

  const openAddSheet = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const openEditSheet = (product: KiwifyProduct) => {
    setCurrentProduct(product);
    setForm({
      kiwify_product_id: product.kiwify_product_id,
      course_id: product.course_id,
      name: product.name,
    });
    setIsSheetOpen(true);
  };

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <LinkIcon className="h-8 w-8 text-primary" />
        Mapeamento de Produtos Kiwify
      </h1>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Produtos Mapeados</CardTitle>
          <Button onClick={openAddSheet}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Mapeamento
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Carregando mapeamentos...</p>
            </div>
          ) : kiwifyProducts.length === 0 ? (
            <p className="text-muted-foreground">Nenhum produto Kiwify mapeado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Produto Kiwify</TableHead>
                  <TableHead>Nome Produto Kiwify</TableHead>
                  <TableHead>Curso Interno</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kiwifyProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>{product.kiwify_product_id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.courses?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditSheet(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{currentProduct ? 'Editar Mapeamento' : 'Novo Mapeamento'}</SheetTitle>
            <SheetDescription>
              {currentProduct ? 'Edite os detalhes do mapeamento.' : 'Crie um novo mapeamento de produto Kiwify para um curso interno.'}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kiwify_product_id">ID do Produto Kiwify</Label>
              <Input
                id="kiwify_product_id"
                value={form.kiwify_product_id}
                onChange={handleInputChange}
                placeholder="Ex: 123456"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Produto Kiwify</Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Ex: Curso Completo de Matemática"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course_id">Curso Interno</Label>
              <Select
                value={form.course_id}
                onValueChange={(value) => handleSelectChange(value, 'course_id')}
                required
              >
                <SelectTrigger id="course_id">
                  <SelectValue placeholder="Selecione um curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{currentProduct ? 'Salvar Alterações' : 'Adicionar Mapeamento'}</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default KiwifyProductMappingPage;