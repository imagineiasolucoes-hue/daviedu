import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, LogOut, School, BookOpen, DollarSign, TrendingUp, TrendingDown, CalendarDays, FileText, UserCheck, ListChecks, HardDrive, ShoppingCart, HelpCircle, LayoutDashboard, ClipboardList, GraduationCap, ChevronDown, BookMarked, FolderKanban, MessageSquare, ShieldCheck, Lock, LinkIcon, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useProfile, UserRole } from '@/hooks/useProfile';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'default' | 'accent';
  onCloseSheet: () => void;
  isSubItem?: boolean;
}

interface NavigationItem extends NavItemProps {
  children?: NavigationItem[];
  featureKey?: string;
  roles: UserRole[]; // Adicionado a propriedade 'roles'
}

interface SidebarProps {
  isSuperAdmin: boolean;
  displayName: string;
  roleDisplay: string;
  onLogout: () => void;
  onCloseSheet: () => void;
  permissions?: {
    teacher?: { [key: string]: boolean };
    secretary?: { [key: string]: boolean };
  };
  tenantName: string | null | undefined; // NOVO: Nome da escola
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
        isSubItem && "ml-4",
        isActive ? activeClasses : inactiveClasses
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isSuperAdmin, displayName, roleDisplay, onLogout, onCloseSheet, permissions, tenantName }) => {
  const location = useLocation();
  const { profile, isTeacher, isAdmin, isSecretary } = useProfile();
  const [openParent, setOpenParent] = useState<string | null>(null);

  // Função para verificar se o usuário tem permissão para uma funcionalidade
  const hasPermission = (featureKey: string | undefined, itemRoles: UserRole[]): boolean => {
    if (isSuperAdmin || isAdmin) return true; // Admins e Super Admins sempre têm acesso total

    if (!featureKey || !profile?.role) return false; // Se não houver chave de funcionalidade ou perfil, não tem acesso

    const userRole = profile.role;
    
    // Se a funcionalidade não está na lista de roles do item, não mostra
    if (!itemRoles.includes(userRole)) return false;

    // Se não há permissões configuradas, o padrão é permitir (ou o que for definido no RolePermissionsForm)
    if (!permissions) return true; 

    // Verifica a permissão específica para a função e funcionalidade
    if (userRole === 'teacher' && permissions.teacher) {
      return permissions.teacher[featureKey] ?? true; // Default para true se não configurado
    }
    if (userRole === 'secretary' && permissions.secretary) {
      return permissions.secretary[featureKey] ?? true; // Default para true se não configurado
    }

    return false; // Por padrão, nega se não houver regra explícita
  };

  const adminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <Home className="h-5 w-5" />, label: "Dashboard", onCloseSheet, featureKey: 'dashboard', roles: ['admin', 'secretary'] },
    {
      to: "/secretaria",
      icon: <FolderKanban className="h-5 w-5" />,
      label: "Secretaria",
      onCloseSheet: () => onCloseSheet(),
      featureKey: 'secretaria_group', // Chave para o grupo da secretaria
      roles: ['admin', 'secretary', 'teacher'], // Professores precisam ver o grupo para acessar sub-itens
      children: [
        { to: "/students", icon: <Users className="h-5 w-5" />, label: "Alunos", onCloseSheet, isSubItem: true, featureKey: 'students', roles: ['admin', 'secretary'] },
        { to: "/teachers", icon: <UserCheck className="h-5 w-5" />, label: "Professores", onCloseSheet, isSubItem: true, featureKey: 'teachers', roles: ['admin', 'secretary'] },
        { to: "/classes", icon: <BookOpen className="h-5 w-5" />, label: "Turmas", onCloseSheet, isSubItem: true, featureKey: 'classes', roles: ['admin', 'secretary'] },
        { to: "/classes/courses", icon: <ListChecks className="h-5 w-5" />, label: "Séries/Anos", onCloseSheet, isSubItem: true, featureKey: 'courses', roles: ['admin', 'secretary', 'teacher'] },
        { to: "/classes/subjects", icon: <BookMarked className="h-5 w-5" />, label: "Matérias", onCloseSheet, isSubItem: true, featureKey: 'subjects', roles: ['admin', 'secretary', 'teacher'] },
        { to: "/grades/entry", icon: <GraduationCap className="h-5 w-5" />, label: "Lançar Notas", onCloseSheet, isSubItem: true, featureKey: 'grades_entry', roles: ['admin', 'secretary', 'teacher'] },
        { to: "/documents", icon: <FileText className="h-5 w-5" />, label: "Documentos", onCloseSheet, isSubItem: true, featureKey: 'documents', roles: ['admin', 'secretary', 'teacher'] },
        { to: "/class-diary/admin-overview", icon: <ClipboardList className="h-5 w-5" />, label: "Diário de Classe (Admin)", onCloseSheet, isSubItem: true, featureKey: 'class_diary_admin', roles: ['admin', 'secretary'] }, // NOVO
      ],
    },
    {
      to: "/finance",
      icon: <DollarSign className="h-5 w-5" />,
      label: "Financeiro",
      onCloseSheet: () => onCloseSheet(),
      featureKey: 'finance_group', // Chave para o grupo financeiro
      roles: ['admin', 'secretary'], // Apenas admin e secretary veem o grupo
      children: [
        { to: "/revenues", icon: <TrendingUp className="h-5 w-5" />, label: "Receitas", onCloseSheet, isSubItem: true, featureKey: 'revenues', roles: ['admin', 'secretary'] },
        { to: "/expenses", icon: <TrendingDown className="h-5 w-5" />, label: "Despesas", onCloseSheet, isSubItem: true, featureKey: 'expenses', roles: ['admin', 'secretary'] },
        { to: "/mensalidades", icon: <Wallet className="h-5 w-5" />, label: "Mensalidades", onCloseSheet, isSubItem: true, featureKey: 'mensalidades', roles: ['admin', 'secretary'] },
      ],
    },
    {
      to: "/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Configurações",
      onCloseSheet: () => onCloseSheet(),
      featureKey: 'settings_group', // Chave para o grupo de configurações
      roles: ['admin', 'secretary', 'teacher'], // Todos podem ver o grupo de configurações
      children: [
        { to: "/settings?tab=profile", icon: <Users className="h-5 w-5" />, label: "Perfil", onCloseSheet, isSubItem: true, featureKey: 'settings_profile', roles: ['admin', 'secretary', 'teacher'] },
        { to: "/settings?tab=school", icon: <School className="h-5 w-5" />, label: "Escola", onCloseSheet, isSubItem: true, featureKey: 'settings_school', roles: ['admin', 'secretary'] },
        { to: "/settings?tab=contracts", icon: <FileText className="h-5 w-5" />, label: "Contratos", onCloseSheet, isSubItem: true, featureKey: 'settings_contracts', roles: ['admin', 'secretary'] },
        { to: "/settings?tab=permissions", icon: <ShieldCheck className="h-5 w-5" />, label: "Permissões", onCloseSheet, isSubItem: true, featureKey: 'settings_permissions', roles: ['admin'] }, // Apenas Admin
        { to: "/settings?tab=security", icon: <Lock className="h-5 w-5" />, label: "Segurança", onCloseSheet, isSubItem: true, featureKey: 'settings_security', roles: ['admin', 'secretary', 'teacher'] },
      ],
    },
    { to: "/faq", icon: <HelpCircle className="h-5 w-5" />, label: "Ajuda (FAQ)", variant: 'accent', onCloseSheet, featureKey: 'faq', roles: ['admin', 'secretary', 'teacher'] },
  ];

  const superAdminNavItems: NavigationItem[] = [
    { to: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, label: "Visão Geral", onCloseSheet, featureKey: 'sa_overview', roles: ['super_admin'] },
    { to: "/super-admin/tenants", icon: <School className="h-5 w-5" />, label: "Gestão de Escolas", onCloseSheet, featureKey: 'sa_tenants', roles: ['super_admin'] },
    { to: "/super-admin/users", icon: <Users className="h-5 w-5" />, label: "Gestão de Usuários", onCloseSheet, featureKey: 'sa_users', roles: ['super_admin'] },
    { to: "/super-admin/subscriptions", icon: <ShoppingCart className="h-5 w-5" />, label: "Gestão de Assinaturas", onCloseSheet, featureKey: 'sa_subscriptions', roles: ['super_admin'] },
    { to: "/super-admin/messages", icon: <MessageSquare className="h-5 w-5" />, label: "Comunicação Global", onCloseSheet, featureKey: 'sa_messages', roles: ['super_admin'] },
    { to: "/backup", icon: <HardDrive className="h-5 w-5" />, label: "Backup Global", onCloseSheet, featureKey: 'sa_backup', roles: ['super_admin'] },
  ];

  let navigationItems: NavigationItem[];
  if (isSuperAdmin) {
    navigationItems = superAdminNavItems;
  } else if (isTeacher) { // Se for professor, ajusta os itens de navegação
    navigationItems = [
      { to: "/teacher/dashboard", icon: <Home className="h-5 w-5" />, label: "Meu Painel", onCloseSheet, featureKey: 'teacher_dashboard', roles: ['teacher'] },
      {
        to: "/secretaria", // O link pai ainda pode ser para secretaria, mas os filhos serão filtrados
        icon: <FolderKanban className="h-5 w-5" />,
        label: "Acadêmico", // Renomeado para professores
        onCloseSheet: () => onCloseSheet(),
        featureKey: 'secretaria_group', 
        roles: ['teacher'], // Apenas professores veem este grupo
        children: [
          { to: "/grades/entry", icon: <GraduationCap className="h-5 w-5" />, label: "Lançar Notas", onCloseSheet, isSubItem: true, featureKey: 'grades_entry', roles: ['teacher'] },
          { to: "/classes/subjects", icon: <BookMarked className="h-5 w-5" />, label: "Matérias e Períodos", onCloseSheet, isSubItem: true, featureKey: 'subjects', roles: ['teacher'] },
          { to: "/classes/courses", icon: <ListChecks className="h-5 w-5" />, label: "Séries/Anos", onCloseSheet, isSubItem: true, featureKey: 'courses', roles: ['teacher'] },
          { to: "/documents", icon: <FileText className="h-5 w-5" />, label: "Documentos", onCloseSheet, isSubItem: true, featureKey: 'documents', roles: ['teacher'] },
          { to: "/class-diary/teacher", icon: <ClipboardList className="h-5 w-5" />, label: "Meu Diário de Classe", onCloseSheet, isSubItem: true, featureKey: 'class_diary_teacher', roles: ['teacher'] }, // NOVO
        ],
      },
      {
        to: "/settings",
        icon: <Settings className="h-5 w-5" />,
        label: "Configurações",
        onCloseSheet: () => onCloseSheet(),
        featureKey: 'settings_group', 
        roles: ['teacher'], 
        children: [
          { to: "/settings?tab=profile", icon: <Users className="h-5 w-5" />, label: "Perfil", onCloseSheet, isSubItem: true, featureKey: 'settings_profile', roles: ['teacher'] },
          { to: "/settings?tab=security", icon: <Lock className="h-5 w-5" />, label: "Segurança", onCloseSheet, isSubItem: true, featureKey: 'settings_security', roles: ['teacher'] },
        ],
      },
      { to: "/faq", icon: <HelpCircle className="h-5 w-5" />, label: "Ajuda (FAQ)", variant: 'accent', onCloseSheet, featureKey: 'faq', roles: ['teacher'] },
    ];
  } else {
    navigationItems = adminNavItems;
  }

  // Filtra os itens de navegação com base nas permissões
  const filteredNavigationItems = navigationItems.filter(item => {
    // Se for um item pai com filhos, verifica se algum filho é visível
    if (item.children) {
      const visibleChildren = item.children.filter(child => hasPermission(child.featureKey, child.roles));
      // O item pai é visível se ele mesmo tiver permissão OU se tiver filhos visíveis
      return hasPermission(item.featureKey, item.roles) || visibleChildren.length > 0;
    }
    // Se não tiver filhos, verifica a permissão do próprio item
    return hasPermission(item.featureKey, item.roles);
  });

  // Determina se um item pai deve estar ativo (se sua rota ou qualquer sub-rota estiver ativa)
  const isParentActive = (item: NavigationItem) => {
    return location.pathname === item.to || (item.children && item.children.some(child => location.pathname.startsWith(child.to)));
  };

  // Efeito para abrir o item pai se uma sub-rota estiver ativa
  useEffect(() => {
    const activeParent = filteredNavigationItems.find(item => isParentActive(item) && item.children);
    if (activeParent && openParent !== activeParent.to) {
      setOpenParent(activeParent.to);
    }
  }, [location.pathname, filteredNavigationItems]);

  const toggleParent = (path: string) => {
    setOpenParent(openParent === path ? null : path);
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-sidebar p-4 border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 lg:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-primary">
          <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-8" />
        </Link>
      </div>
      
      {/* NOVO: Exibição do nome da escola */}
      {!isSuperAdmin && tenantName && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b border-sidebar-border">
          <p className="font-semibold text-primary">Escola:</p>
          <p className="truncate">{tenantName}</p>
        </div>
      )}

      <Separator className="bg-sidebar-border" />

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid items-start gap-1 text-sm font-medium">
          {filteredNavigationItems.map((item) => (
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
                  {item.children
                    .filter(child => hasPermission(child.featureKey, child.roles))
                    .map((child) => (
                      <NavItem key={child.to} {...child} isSubItem={true} />
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