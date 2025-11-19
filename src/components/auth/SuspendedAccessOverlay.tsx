import React from 'react';
import { AlertTriangle, Phone, Mail, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SuspendedAccessOverlay: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Você foi desconectado.");
      navigate('/', { replace: true });
    } catch (error) {
      toast.error("Erro ao Sair", { description: "Não foi possível desconectar." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/95 backdrop-blur-sm dark:bg-gray-900/95 p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl border-destructive/50">
        <CardHeader>
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <CardTitle className="text-2xl text-destructive">Acesso Suspenso</CardTitle>
          <CardDescription>
            O acesso à sua escola foi temporariamente suspenso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Por favor, entre em contato com a equipe DaviEDU para regularizar a situação e reativar o acesso ao sistema.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <a href="https://wa.me/5571992059840" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                (71) 99205-9840 (WhatsApp)
              </a>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <a href="mailto:imagineiasolucoes@gmail.com" className="text-primary hover:underline font-medium">
                imagineiasolucoes@gmail.com
              </a>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full mt-4"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair do Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspendedAccessOverlay;