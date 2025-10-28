import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";
import usePageTitle from "@/hooks/usePageTitle";

const Login = () => {
  usePageTitle("Login");
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // Wait for auth state to load
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Acesse sua conta
        </h1>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          view="sign_in" // This ensures only the login form is shown
          theme="light"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
              },
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
                button_label: 'Enviar instruções de redefinição',
                email_label: 'Email',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;