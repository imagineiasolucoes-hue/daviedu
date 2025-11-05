import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoverDropdownNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  children: { to: string; icon: React.ReactNode; label: string; }[];
  onCloseSheet: () => void;
}

const HoverDropdownNavItem: React.FC<HoverDropdownNavItemProps> = ({ to, icon, label, children, onCloseSheet }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // Adiciona um pequeno atraso para abrir, evitando aberturas acidentais
    openTimeoutRef.current = setTimeout(() => setIsOpen(true), 100); 
  };

  const handleClose = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
    }
    // Mantém o atraso para fechar, permitindo mover o mouse para o conteúdo
    closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 150); 
  };

  // Determina se o item pai deve estar ativo com base em sua própria rota ou na rota de qualquer filho ativo
  const isActive = location.pathname === to || children.some(child => location.pathname.startsWith(child.to));

  const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90";
  const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    // A div externa agora gerencia os eventos de mouse para todo o componente dropdown
    <div onMouseEnter={handleOpen} onMouseLeave={handleClose}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Link
            to={to}
            onClick={onCloseSheet}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all cursor-pointer",
              isActive ? activeClasses : inactiveClasses
            )}
          >
            <div className="flex items-center gap-3">
              {icon}
              {label}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </Link>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          className="w-48 p-1 ml-2"
          // Não precisamos mais de onMouseEnter/onMouseLeave aqui, a div pai já cuida
        >
          {children.map((child) => (
            <DropdownMenuItem key={child.to} asChild>
              <Link
                to={child.to}
                onClick={onCloseSheet}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-all",
                  location.pathname === child.to ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {child.icon}
                {child.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HoverDropdownNavItem;