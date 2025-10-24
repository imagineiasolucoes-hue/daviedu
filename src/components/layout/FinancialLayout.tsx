import { NavLink, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const financialNavItems = [
  { href: "/financeiro/dashboard", label: "Dashboard" },
  { href: "/financeiro/receitas", label: "Receitas" },
  { href: "/financeiro/despesas", label: "Despesas" },
  { href: "/financeiro/folha-de-pagamento", label: "Folha de Pagamento" },
];

const FinancialLayout = () => {
  const location = useLocation();

  // Redirect base /financeiro to /financeiro/dashboard
  if (location.pathname === "/financeiro") {
    window.location.replace("/financeiro/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie mensalidades, pagamentos e relatórios financeiros.
        </p>
      </div>
      <div className="border-b">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {financialNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-2">
        <Outlet />
      </div>
    </div>
  );
};

export default FinancialLayout;