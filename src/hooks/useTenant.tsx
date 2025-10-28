import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTenantId } from "@/lib/tenant";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantContextType {
  tenantId: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({
  children,
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenantId"],
    queryFn: fetchTenantId,
    staleTime: Infinity, // O tenantId não deve mudar durante a sessão
    retry: false, // Se falhar uma vez, provavelmente falhará de novo
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando dados da escola...</p>
      </div>
    );
  }

  if (error || data?.error || !data?.tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <div className="w-full max-w-md p-8 text-center bg-background rounded-lg shadow-md">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Erro Crítico</h2>
          <p className="mt-2 text-muted-foreground">
            Não foi possível carregar as informações da sua escola. Isso pode
            ocorrer se o seu perfil de usuário não estiver corretamente
            configurado.
          </p>
          <p className="mt-1 text-sm text-red-500">
            Detalhe: {error?.message || data?.error}
          </p>
          <Button onClick={() => window.location.reload()} className="mt-6">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenantId: data.tenantId }}>
      {children}
    </TenantContext.Provider>
  );
};