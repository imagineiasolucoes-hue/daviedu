import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom'; // Importar Link

const AppFooter: React.FC = () => {
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const buildTimestamp = import.meta.env.VITE_BUILD_TIMESTAMP;
  const fullVersion = `v${appVersion}.${buildTimestamp}`;

  return (
    <footer className="w-full border-t border-border/50 bg-background p-4 print-hidden">
      <Separator className="mb-4" />
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 mb-2 sm:mb-0">
          <p>
            &copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.
          </p>
          {appVersion && buildTimestamp && (
            <p className="font-mono text-muted-foreground/80">
              {fullVersion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Criado por:</span>
          <img 
            src="/imagine-ia-logo.png" 
            alt="Imagine IA Soluções Logo" 
            className="h-5" 
          />
        </div>
        {/* NOVO: Links de Políticas */}
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link to="/privacy" className="hover:text-primary">Política de Privacidade</Link>
          <Link to="/terms" className="hover:text-primary">Termos de Uso</Link>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;