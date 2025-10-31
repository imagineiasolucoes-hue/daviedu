import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Upload, Download, School } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Separator } from '@/components/ui/separator';

const tenantConfigSchema = z.object({
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zip_code: z.string().optional(),
  logo_url: z.string().url().optional().nullable(),
});

const tenantSchema = z.object({
  name: z.string().min(3, "O nome da escola é obrigatório."),
  config: tenantConfigSchema.optional().nullable(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface Tenant extends TenantFormData {
  id: string;
}

const fetchTenant = async (tenantId: string): Promise<Tenant> => {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, config')
    .eq('id', tenantId)
    .single();
  if (error) throw new Error(error.message);
  return data as Tenant;
};

const SchoolSettingsForm: React.FC = () => {
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const tenantId = profile?.tenant_id;
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const { data: tenant, isLoading } = useQuery<Tenant, Error>({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenant(tenantId!),
    enabled: !!tenantId,
  });

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name,
        config: tenant.config,
      });
    }
  }, [tenant, form]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: TenantFormData) => {
    if (!tenantId) return;

    let logoUrl = tenant?.config?.logo_url;

    if (logoFile) {
      const filePath = `${tenantId}/${Date.now()}_${logoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('school_logos')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) {
        toast.error("Erro no Upload", { description: uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('school_logos')
        .getPublicUrl(filePath);
      logoUrl = publicUrl;
    }

    const updatedConfig = { ...data.config, logo_url: logoUrl };

    const { error } = await supabase
      .from('tenants')
      .update({ name: data.name, config: updatedConfig })
      .eq('id', tenantId);

    if (error) {
      toast.error("Erro ao Salvar", { description: error.message });
    } else {
      toast.success("Configurações salvas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      setLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const svg = qrCodeRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qrcode-pre-matricula-${tenant?.name?.replace(/\s+/g, '-').toLowerCase()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgString);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const preEnrollmentLink = `${window.location.origin}/pre-matricula/${tenantId}`;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Escola</CardTitle>
          <CardDescription>Gerencie as informações, logo e QR code da sua instituição.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Informações Gerais */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Informações Gerais</h3>
              <p className="text-sm text-muted-foreground">Dados principais da escola.</p>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Escola</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" {...form.register("config.cnpj")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" {...form.register("config.phone")} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Endereço</h3>
              <p className="text-sm text-muted-foreground">Localização da instituição.</p>
            </div>
            <div className="md:col-span-2 grid gap-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address_street">Rua</Label>
                  <Input id="address_street" {...form.register("config.address_street")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_number">Número</Label>
                  <Input id="address_number" {...form.register("config.address_number")} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_neighborhood">Bairro</Label>
                  <Input id="address_neighborhood" {...form.register("config.address_neighborhood")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_zip_code">CEP</Label>
                  <Input id="address_zip_code" {...form.register("config.address_zip_code")} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_city">Cidade</Label>
                  <Input id="address_city" {...form.register("config.address_city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">Estado</Label>
                  <Input id="address_state" {...form.register("config.address_state")} />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Logo da Escola */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">Logo da Escola</h3>
              <p className="text-sm text-muted-foreground">Faça o upload da imagem da sua marca.</p>
            </div>
            <div className="md:col-span-2 flex items-center gap-6">
              <Avatar className="h-24 w-24 border">
                <AvatarImage src={logoPreview || tenant?.config?.logo_url || ''} alt="Logo da Escola" />
                <AvatarFallback><School className="h-10 w-10 text-muted-foreground" /></AvatarFallback>
              </Avatar>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button type="button" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  {logoFile ? "Alterar Imagem" : "Enviar Imagem"}
                </Button>
              </Label>
              <Input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleLogoChange} />
            </div>
          </div>

          <Separator />

          {/* QR Code */}
          <div className="grid md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1">
              <h3 className="font-semibold">QR Code de Pré-Matrícula</h3>
              <p className="text-sm text-muted-foreground">Use em materiais de divulgação para facilitar o acesso ao formulário.</p>
            </div>
            <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6">
              <div className="p-4 border rounded-lg bg-white">
                <QRCodeSVG value={preEnrollmentLink} size={128} ref={qrCodeRef} />
              </div>
              <div className="space-y-2">
                <Button type="button" onClick={handleDownloadQR}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar QR Code
                </Button>
                <p className="text-xs text-muted-foreground break-all">{preEnrollmentLink}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default SchoolSettingsForm;