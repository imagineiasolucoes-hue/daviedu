import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Loader2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Separator } from '@/components/ui/separator';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isLoading, isSuperAdmin, isAdmin } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.first_name || user?.email;
  const roleDisplay = profile?.role ? profile.role.replace('_', ' ').toUpperCase() : 'N/A';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            {isSuperAdmin ? "Dashboard SUPER ADM" : "Dashboard da Escola"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xl font-medium">
            Bem-vindo(a), {displayName}!
          </p>
          
          <Separator />

          <div className="text-left space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Função (Role):</span> <span className="font-bold text-accent">{roleDisplay}</span>
            </p>
            {profile?.tenant_id && (
              <p className="text-sm">
                <span className="font-semibold">Tenant ID:</span> {profile.tenant_id}
              </p>
            )}
            {!profile?.tenant_id && !isSuperAdmin && (
                <p className="text-sm text-destructive font-semibold">
                    Atenção: Seu perfil ainda não está associado a uma escola (Tenant ID ausente).
                </p>
            )}
          </div>

          <Button onClick={handleLogout} variant="destructive" className="w-full mt-6">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;