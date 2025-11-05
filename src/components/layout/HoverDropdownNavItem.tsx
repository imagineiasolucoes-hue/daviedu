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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Pequeno atraso para evitar fechamento acidental
  };

  // Determina se o item pai deve estar ativo com base em sua própria rota ou na rota de qualquer filho ativo
  const isActive = location.pathname === to || children.some(child => location.pathname.startsWith(child.to));

  const activeClasses = "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90";
  const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Link
          to={to}
          onClick={onCloseSheet}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-all cursor-pointer",
            isActive ? activeClasses : inactiveClasses
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
        onMouseEnter={handleMouseEnter} // Mantém aberto ao passar o mouse sobre o conteúdo
        onMouseLeave={handleMouseLeave} // Fecha ao sair do conteúdo
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
  );
};

export default HoverDropdownNavItem;