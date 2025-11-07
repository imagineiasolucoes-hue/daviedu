import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut, Home, Users, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import Sidebar from './Sidebar';
import AppFooter from './AppFooter';
import { useBackupMonitoring } from '@/hooks/useBackupMonitoring';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AppLayout: React.FC = () => {
  const { user, session } = useAuth();
  const { profile, isLoading, isSuperAdmin } = useProfile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();

  useBackupMonitoring();

  const handleLogout = async () => {
    console.log("Tentando deslogar. Usuário atual:", user);
    console.log("Objeto de sessão atual:", session);

    if (!session) {
      console.warn("Nenhuma sessão ativa encontrada ao tentar deslogar. O usuário pode já estar deslogado ou a sessão é inválida.");
      toast.info("Você já está desconectado ou sua sessão expirou.");
      // Garante o redirecionamento mesmo se nenhuma sessão for encontrada
      navigate('/', { replace: true });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro durante o signOut do Supabase:", error);
        toast.error("Erro ao Sair", { description: error.message });
        
        // Fallback: Se o signOut do Supabase falhar, limpa manualmente o armazenamento local e recarrega
        console.warn("Supabase signOut falhou. Tentando fallback: limpando armazenamento local e recarregando a página.");
        localStorage.removeItem('sb-fhrxqkzswawlellkiaak-auth-token'); 
        window.location.reload(); // Isso irá disparar uma reinicialização completa
      } else {
        toast.success("Você foi desconectado com sucesso.");
        // O onAuthStateChange do Supabase deve lidar com a navegação para '/'
      }
    } catch (error: any) {
      console.error("Erro inesperado durante o signOut:", error);
      toast.error("Erro ao Sair", { description: error.message || "Ocorreu um erro inesperado." });
      
      // Fallback para quaisquer erros inesperados
      console.warn("Erro inesperado durante o signOut. Tentando fallback: limpando armazenamento local e recarregando a página.");
      localStorage.removeItem('sb-fhrxqkzswawlellkiaak-auth-token'); 
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.first_name || user?.email || 'Usuário';
  const roleDisplay = profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'N/A';

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar 
          isSuperAdmin={isSuperAdmin} 
          displayName={displayName} 
          roleDisplay={roleDisplay} 
          onLogout={handleLogout} 
          onCloseSheet={() => {}}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow">
        {/* Header for Mobile/Tablet */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent lg:hidden print-hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de Navegação</SheetTitle>
                <SheetDescription>Navegue pelas seções do aplicativo.</SheetDescription>
              </SheetHeader>
              <Sidebar 
                isSuperAdmin={isSuperAdmin} 
                displayName={displayName} 
                roleDisplay={roleDisplay} 
                onLogout={handleLogout} 
                onCloseSheet={() => setIsSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-semibold">Davi EDU</h1>
          <div className="ml-auto">
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  );
};

export default AppLayout;