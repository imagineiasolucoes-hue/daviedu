import React from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut, Home, Users, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import Sidebar from './Sidebar';
import AppFooter from './AppFooter'; // Importando o novo rodapé
import BackupAlerts from '@/components/BackupAlerts'; // Importando o componente de alertas

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const { profile, isLoading, isSuperAdmin } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    // O loading já é tratado no ProtectedRoute, mas mantemos aqui para o caso de recarga
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
        <Sidebar isSuperAdmin={isSuperAdmin} displayName={displayName} roleDisplay={roleDisplay} onLogout={handleLogout} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow">
        {/* Header for Mobile/Tablet */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent lg:hidden print-hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <Sidebar isSuperAdmin={isSuperAdmin} displayName={displayName} roleDisplay={roleDisplay} onLogout={handleLogout} />
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
      
      {/* Global Backup Alerts for Super Admins */}
      {isSuperAdmin && <BackupAlerts />}
    </div>
  );
};

export default AppLayout;