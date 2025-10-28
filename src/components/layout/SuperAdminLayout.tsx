import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building,
  Users,
  DollarSign,
  LogOut,
  Menu,
  Settings,
  ChevronDown,
  BarChart3,
  CreditCard,
  Loader2, // Adicionado Loader2 aqui
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useQuery } from "@tanstack/react-query";

const superAdminNavItems = [
  // Itens de navegação removidos para começar do zero
];

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(href);
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-primary/10 text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const SuperAdminLayout = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [greetingMessage, setGreetingMessage] = useState<React.ReactNode | null>(null);

  // Fetch user role to protect this route
  const { data: userRole, isLoading: isRoleLoading } = useQuery({
    queryKey: ["userRole", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data.role;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const hasShownGreeting = sessionStorage.getItem('hasShownSuperAdminLayoutGreeting');
    if (!hasShownGreeting && user) {
      const hour = new Date().getHours();
      let greeting = "";
      if (hour < 12) {
        greeting = "Bom dia";
      } else if (hour < 18) {
        greeting = "Boa tarde";
      } else {
        greeting = "Boa noite";
      }

      const userName = user.user_metadata?.first_name || user.email?.split('@')[0];
      
      const message = (
        <>
          {greeting}, <i className="italic">{userName}</i> (Super Admin)!
        </>
      );
      setGreetingMessage(message);

      sessionStorage.setItem('hasShownSuperAdminLayoutGreeting', 'true');

      const timer = setTimeout(() => {
        setGreetingMessage(null);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('hasShownSuperAdminLayoutGreeting');
    navigate("/");
  };

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not a super_admin
  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />; // Redirect to regular dashboard or a 403 page
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/super-admin/dashboard" className="flex items-center gap-2 font-semibold">
              <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-10" />
              <span className="text-sm font-bold text-primary">SUPER ADMIN</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {superAdminNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link to="/super-admin/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-10" />
                  <span className="text-sm font-bold text-primary">SUPER ADMIN</span>
                </Link>
                {superAdminNavItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1 flex items-center">
            {greetingMessage && (
              <span className="text-sm font-medium text-muted-foreground transition-opacity duration-500 ease-in-out opacity-100">
                {greetingMessage}
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.user_metadata?.first_name || user?.email}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta (Super Admin)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;