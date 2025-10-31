import React from 'react';
import { Separator } from '@/components/ui/separator';

const AppFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/50 bg-background p-4 print-hidden">
      <Separator className="mb-4" />
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground max-w-7xl mx-auto">
        <p className="mb-2 sm:mb-0">
          &copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm">Criado por:</span>
          <img 
            src="/imagine-ia-logo.png" 
            alt="Imagine IA Soluções Logo" 
            className="h-5" 
          />
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;