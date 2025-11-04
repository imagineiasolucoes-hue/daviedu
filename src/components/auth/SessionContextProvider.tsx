import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner'; // Usando sonner

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SessionContextProvider');
  }
  return context;
};

interface SessionContextProviderProps {
  children: React.ReactNode;
}

export const SessionContextProvider: React.FC<SessionContextProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Log do User ID apenas na sessão inicial ou sign in
        if (currentSession?.user && event === 'INITIAL_SESSION') {
          console.log("Current User ID (Initial Session):", currentSession.user.id);
        }

        if (currentSession && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
          // Redirect authenticated users away from login/register page
          navigate('/dashboard', { replace: true });
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        // Redirect unauthenticated users to the index page after logout
        if (window.location.pathname !== '/' && window.location.pathname !== '/pre-matricula') {
          navigate('/', { replace: true });
        }
      } else if (event === 'AUTH_API_ERROR' as string) { // Asserção de tipo para corrigir o erro TS2367
        // Tratamento de erro de API de autenticação
        toast.error("Erro de Autenticação", {
          description: "Ocorreu um erro na API de autenticação. Tente novamente.",
        });
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Memoiza o valor do contexto para evitar re-renders desnecessários nos consumidores
  const value = useMemo(() => ({ session, user, isLoading }), [session, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};