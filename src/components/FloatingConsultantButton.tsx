import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'consultant_button_closed';

const FloatingConsultantButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // Verifica se o usuário fechou o botão anteriormente
    const closed = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsClosed(closed);
    
    // Mostra o botão após um pequeno delay para não atrapalhar o carregamento inicial
    if (!closed) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setIsClosed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (isClosed || !isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-500",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <div className="relative p-3 bg-card rounded-xl shadow-2xl border border-border/50 flex items-center gap-3">
        <a 
          href="https://wa.me/5571992059840" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            <MessageSquare className="h-5 w-5 mr-2" />
            Fale com um consultor
          </Button>
        </a>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow-md hover:bg-muted"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default FloatingConsultantButton;