import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, LogOut, School, BookOpen, DollarSign, TrendingUp, TrendingDown, CalendarDays, FileText, UserCheck, ListChecks, HardDrive, ShoppingCart, HelpCircle, LayoutDashboard, ClipboardList, GraduationCap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/useProfile';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'accent';
  onCloseSheet: () => void;
  isSubItem?: boolean; // Para estilizar sub-itens
}

interface NavigationItem extends NavItemProps {
  children?: NavigationItem[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, variant = 'default', onCloseSheet, isSubItem = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (isSubItem && location.pathname.startsWith(to));

  const activeClasses = variant === 'accent'
    ? "bg-accent text-accent-foreground hover:bg-accent/90"
    : "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90";

  const inactiveClasses = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Link
      to={to}
      onClick={onCloseSheet}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        isSubItem && "ml-4", // Indentação para sub-itens
        isActive ? activeClasses : inactiveClasses
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
  onCloseSheet: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSuperAdmin, displayName, roleDisplay, onLogout, onCloseSheet }) => {
  const location = useLocation();
  const { isTeacher } = useProfile();
  const [openParent, setOpenParent] = useState<string | null>(null); // Estado para controlar qual item pai está aberto

  // Função para alternar a abertura de um item pai
  const toggleParent = (path: string) => {
    setOpenParent(prev => (prev === path ? null : path));
  };

  // Determina se um item pai deve estar ativo (se sua rota ou qualquer sub-rota estiver ativa)
  const isParentActive = (item: NavigationItem) => {
    return location.pathname === item.to || (item.children && item.children.some(child => location.pathname.startsWith(child.to)));
  };

  const adminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard", onCloseSheet },
    { to: "/students", icon: <Users className="h-5 w-5" />, label: "Alunos", onCloseSheet },
    {
      to: "/teachers",
      icon: <UserCheck className="h-5 w-5" />,
      label: "Professores",
      onCloseSheet: () => onCloseSheet(),
      children: [
        { to: "/teacher/grade-entry", icon: <GraduationCap className="h-5 w-5" />, label: "Lançar Notas", onCloseSheet, isSubItem: true },
        { to: "/teacher/class-diary", icon: <BookOpen className="h-5 w-5" />, label: "Diário de Classe", onCloseSheet, isSubItem: true },
      ],
    },
    {
      to: "/classes", // Agora esta é a página de Gestão de Turmas
      icon: <BookOpen className="h-5 w-5" />,
      label: "Turmas",
      onCloseSheet: () => onCloseSheet(),
      children: [
        { to: "/classes/courses", icon: <ListChecks className="h-5 w-5" />, label: "Séries/Anos", onCloseSheet, isSubItem: true }, // Sub-item para Séries/Anos
      ],
    },
    { to: "/calendar", icon: <CalendarDays className="h-5 w-5" />, label: "Calendário", onCloseSheet },
    { to: "/documents", icon: <FileText className="h-5 w-5" />, label: "Documentos", onCloseSheet },
    {
      to: "/finance",
      icon: <DollarSign className="h-5 w-5" />,
      label: "Financeiro",
      onCloseSheet: () => onCloseSheet(),
      children: [
        { to: "/revenues", icon: <TrendingUp className="h-5 w-5" />, label: "Receitas", onCloseSheet, isSubItem: true },
        { to: "/expenses", icon: <TrendingDown className="h-5 w-5" />, label: "Despesas", onCloseSheet, isSubItem: true },
      ],
    },
    { to: "/settings", icon: <Settings className="h-5 w-5" />, label: "Configurações", onCloseSheet },
    { to: "/faq", icon: <HelpCircle className="h-5 w-5" />, label: "Ajuda (FAQ)", variant: 'accent', onCloseSheet },
  ];

  const superAdminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Visão Geral", onCloseSheet },
    { to: "/super-admin/tenants", icon: <School className="h-5 w-5" />, label: "Gestão de Escolas", onCloseSheet },
    { to: "/super-admin/users", icon: <Users className="h-5 w-5" />, label: "Gestão de Usuários", onCloseSheet },
    { to: "/backup", icon: <HardDrive className="h-5 w-5" />, label: "Backup Global", onCloseSheet },
  ];

  const teacherNavItems: NavigationItem[] = [
    { to: "/teacher/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Meu Painel", onCloseSheet },
    { to: "/teacher/grade-entry", icon: <GraduationCap className="h-5 w-5" />, label: "Lançar Notas", onCloseSheet },
    { to: "/teacher/class-diary", icon: <BookOpen className="h-5 w-5" />, label: "Diário de Classe", onCloseSheet },
    { to: "/settings", icon: <Settings className="h-5 w-5" />, label: "Configurações", onCloseSheet },
    { to: "/faq", icon: <HelpCircle className="h-5 w-5" />, label: "Ajuda (FAQ)", variant: 'accent', onCloseSheet },
  ];

  let navigationItems: NavigationItem[];
  if (isSuperAdmin) {
    navigationItems = superAdminNavItems;
  } else if (isTeacher) {
    navigationItems = teacherNavItems;
  } else {
    navigationItems = adminNavItems;
  }

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
          {navigationItems.map((item) => (
            <React.Fragment key={item.to}>
              {item.children && item.children.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex-grow"> 
                    <NavItem
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                      variant={item.variant}
                      onCloseSheet={item.onCloseSheet}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleParent(item.to)}
                    className={cn(
                      "h-8 w-8",
                      isParentActive(item)
                        ? "text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", openParent === item.to && "rotate-180")} />
                  </Button>
                </div>
              ) : (
                <NavItem {...item} />
              )}

              {(openParent === item.to || (item.children && item.children.some(child => location.pathname.startsWith(child.to)))) && item.children && (
                <div className="grid gap-1 pl-4">
                  {item.children.map((child) => (
                    <NavItem key={child.to} {...child} />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
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
          onClick={() => {
            onLogout();
            onCloseSheet();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;