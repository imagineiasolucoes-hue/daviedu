import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, DollarSign, ArrowDownCircle, TrendingUp, Loader2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import FinancialPieChart from "@/components/dashboard/FinancialPieChart";
import usePageTitle from "@/hooks/usePageTitle";

const fetchReportData = async (tenantId: string | null, dateRange?: DateRange) => {
  if (!tenantId) throw new Error("ID da escola não encontrado.");
  if (!dateRange?.from || !dateRange?.to) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      revenueByCategory: [],
      expensesByCategory: [],
    };
  }

  const fromDate = format(dateRange.from, "yyyy-MM-dd");
  const toDate = format(dateRange.to, "yyyy-MM-dd");

  // Fetch paid revenues
  const { data: revenues, error: revenueError } = await supabase
    .from("revenues")
    .select("amount, revenue_categories (name)")
    .eq("tenant_id", tenantId)
    .eq("status", "pago")
    .gte("date", fromDate)
    .lte("date", toDate);
  if (revenueError) throw revenueError;

  // Find payroll category ID(s) to exclude them from general expenses
  const { data: payrollCatData, error: catError } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('name', '%folha%');
  if (catError) throw catError;
  const payrollCategoryIds = payrollCatData ? payrollCatData.map(c => c.id) : [];

  // Fetch paid expenses, EXCLUDING payroll categories to avoid double counting
  let expensesQuery = supabase
    .from("expenses")
    .select("amount, expense_categories (name)")
    .eq("tenant_id", tenantId)
    .eq("status", "pago")
    .gte("date", fromDate)
    .lte("date", toDate);

  if (payrollCategoryIds.length > 0) {
    expensesQuery = expensesQuery.not('category_id', 'in', `(${payrollCategoryIds.join(',')})`);
  }
  
  const { data: expenses, error: expenseError } = await expensesQuery;
  if (expenseError) throw expenseError;

  // Fetch paid payrolls
  const { data: payrolls, error: payrollError } = await supabase
    .from("payrolls")
    .select("net_salary")
    .eq("tenant_id", tenantId)
    .eq("payment_status", "pago")
    .gte("reference_month", fromDate)
    .lte("reference_month", toDate);
  if (payrollError) throw payrollError;

  // Process data
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const regularExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const payrollExpenses = payrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const totalExpenses = regularExpenses + payrollExpenses;

  const processCategories = (items: any[], categoryField: string, defaultName: string) => {
    const categoryMap = new Map<string, number>();
    items.forEach(item => {
      const categoryName = (item[categoryField] as any)?.name || defaultName;
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + item.amount);
    });
    return Array.from(categoryMap, ([name, value]) => ({ name, value }));
  };

  const expensesByCategory = processCategories(expenses, 'expense_categories', 'Sem Categoria');
  if (payrollExpenses > 0) {
    expensesByCategory.push({ name: "Folha de Pagamento", value: payrollExpenses });
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    revenueByCategory: processCategories(revenues, 'revenue_categories', 'Sem Categoria').sort((a, b) => b.value - a.value),
    expensesByCategory: expensesByCategory.sort((a, b) => b.value - a.value),
  };
};

const FinancialDashboard = () => {
  usePageTitle("Dashboard Financeiro");
  const { tenantId } = useTenant();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [filterPreset, setFilterPreset] = useState("this_month");

  useEffect(() => {
    const now = new Date();
    switch (filterPreset) {
      case "this_month":
        setDate({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case "last_month":
        const lastMonth = subMonths(now, 1);
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "last_90_days":
        setDate({ from: subDays(now, 90), to: now });
        break;
      case "this_year":
        setDate({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case "custom":
        // Do nothing, let the user pick the date
        break;
    }
  }, [filterPreset]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["financialReports", tenantId, date],
    queryFn: () => fetchReportData(tenantId, date),
    enabled: !!tenantId && !!date?.from && !!date?.to,
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print-hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">
            Analise o desempenho financeiro da sua instituição.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={filterPreset} onValueChange={setFilterPreset}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Selecione um período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Este Mês</SelectItem>
              <SelectItem value="last_month">Mês Passado</SelectItem>
              <SelectItem value="last_90_days">Últimos 90 dias</SelectItem>
              <SelectItem value="this_year">Este Ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                disabled={filterPreset !== 'custom'}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: ptBR })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(range) => {
                  setDate(range);
                  setFilterPreset("custom");
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div id="printable-area">
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">Erro ao carregar os dados do relatório.</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(data?.totalRevenue || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(data?.totalExpenses || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", (data?.netProfit || 0) >= 0 ? "text-primary" : "text-red-600")}>
                    {formatCurrency(data?.netProfit || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receitas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialPieChart data={data?.revenueByCategory || []} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialPieChart data={data?.expensesByCategory || []} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;