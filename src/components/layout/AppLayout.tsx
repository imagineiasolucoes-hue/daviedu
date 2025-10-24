import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, DollarSign, Users, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Despesas", icon: DollarSign },
  { href: "/teachers", label: "Professores", icon: Users },
  { href: "/payroll", label: "Folha de Pagamento", icon: FileText },
];

const Sidebar: React.FC<{ isMobile?: boolean; onClose?: () => void }> = ({
  isMobile = false,
  onClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="text-2xl font-bold text-sidebar-primary mb-6">
        Gestão Escolar
      </div>
      <nav className="flex-grow space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start text-base font-medium transition-colors",
              location.pathname === item.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
                : "hover:bg-sidebar-accent/50",
            )}
            onClick={() => handleNavigation(item.href)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>
      <MadeWithDyad />
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Header and Menu */}
      <header className="lg:hidden sticky top-0 z-10 w-full bg-card border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Gestão Escolar</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar isMobile={true} onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-0 lg:p-0">
        <div className="lg:pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;