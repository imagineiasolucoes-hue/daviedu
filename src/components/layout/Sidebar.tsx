import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, LogOut, School, BookOpen, DollarSign, TrendingUp, TrendingDown, CalendarDays, FileText, UserCheck, ListChecks, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

// Definindo o tipo para os itens de navegação, incluindo isSubItem
interface NavigationItem extends NavItemProps {
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  // Verifica se a rota atual é exatamente a rota do item ou se é uma sub-rota (para manter o pai ativo)
  const isActive = location.pathname === to || (to === '/classes' && location.pathname.startsWith('/classes/'));

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

interface SidebarProps {
  isSuperAdmin: boolean;
  displayName: string;
  roleDisplay: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSuperAdmin, displayName, roleDisplay, onLogout }) => {
  const location = useLocation();
  const isClassesActive = location.pathname.startsWith('/classes');

  const adminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard" },
    // Secretaria
    { to: "/students", icon: <Users className="h-5 w-5" />, label: "Alunos" },
    { to: "/teachers", icon: <UserCheck className="h-5 w-5" />, label: "Professores" },
    { to: "/classes", icon: <BookOpen className="h-5 w-5" />, label: "Turmas" },
    // Sub-item de Turmas
    { to: "/classes/courses", icon: <ListChecks className="h-5 w-5 ml-4" />, label: "Cursos/Séries", isSubItem: true },
    { to: "/calendar", icon: <CalendarDays className="h-5 w-5" />, label: "Calendário" },
    { to: "/documents", icon: <FileText className="h-5 w-5" />, label: "Documentos" },
    // Financeiro
    { to: "/finance", icon: <DollarSign className="h-5 w-5" />, label: "Financeiro" },
    { to: "/revenues", icon: <TrendingUp className="h-5 w-5 ml-4" />, label: "Receitas" },
    { to: "/expenses", icon: <TrendingDown className="h-5 w-5 ml-4" />, label: "Despesas" },
    // Geral
    { to: "/backup", icon: <HardDrive className="h-5 w-5" />, label: "Backup" },
    { to: "/settings", icon: <Settings className="h-5 w-5" />, label: "Configurações" },
  ];

  const superAdminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard SA" },
    { to: "/super-admin/tenants", icon: <School className="h-5 w-5" />, label: "Escolas (Tenants)" },
    { to: "/super-admin/users", icon: <Users className="h-5 w-5" />, label: "Usuários SA" }, // Novo item de navegação
    { to: "/backup", icon: <HardDrive className="h-5 w-5" />, label: "Backup" },
  ];

  const navigationItems = isSuperAdmin ? superAdminNavItems : adminNavItems;

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar p-4 border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-primary">
          <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-8" />
        </Link>
      </div>
      
      <Separator className="bg-sidebar-border" />

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid items-start gap-1 text-sm font-medium">
          {navigationItems.map((item) => {
            // Renderiza o item principal
            if (!item.isSubItem) {
              return <NavItem key={item.to} {...item} />;
            }
            
            // Renderiza o sub-item se o item pai estiver ativo (Turmas)
            if (item.isSubItem && isClassesActive) {
                return (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all ml-4",
                            location.pathname === item.to
                                ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                );
            }
            return null;
          })}
        </nav>
      </div>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-1 text-sm text-sidebar-foreground">
          <p className="font-semibold truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">{roleDisplay}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start mt-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;