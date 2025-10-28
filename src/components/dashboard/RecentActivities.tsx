import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchTenantId } from "@/lib/tenant";
import { Loader2, UserPlus, DollarSign, ArrowDownCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Activity {
  type: 'student' | 'revenue' | 'expense';
  description: string;
  detail: string;
  date: string;
  icon: React.ElementType;
}

const fetchRecentActivities = async (): Promise<Activity[]> => {
  const { tenantId, error: tenantError } = await fetchTenantId();
  if (tenantError) throw new Error(tenantError);

  const [studentsRes, revenuesRes, expensesRes] = await Promise.all([
    supabase.from('students').select('full_name, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('revenues').select('description, amount, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
    supabase.from('expenses').select('description, amount, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (revenuesRes.error) throw revenuesRes.error;
  if (expensesRes.error) throw expensesRes.error;

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const students: Activity[] = studentsRes.data.map(s => ({
    type: 'student',
    description: 'Novo aluno cadastrado',
    detail: s.full_name,
    date: s.created_at,
    icon: UserPlus,
  }));

  const revenues: Activity[] = revenuesRes.data.map(r => ({
    type: 'revenue',
    description: 'Nova receita adicionada',
    detail: `${r.description || 'Receita'} - ${formatCurrency(r.amount)}`,
    date: r.created_at,
    icon: DollarSign,
  }));

  const expenses: Activity[] = expensesRes.data.map(e => ({
    type: 'expense',
    description: 'Nova despesa adicionada',
    detail: `${e.description || 'Despesa'} - ${formatCurrency(e.amount)}`,
    date: e.created_at,
    icon: ArrowDownCircle,
  }));

  const allActivities = [...students, ...revenues, ...expenses];
  
  return allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
};

const RecentActivities = () => {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: fetchRecentActivities,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm p-4">Erro ao carregar atividades.</div>;
  }

  if (!activities || activities.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Nenhuma atividade recente.</div>;
  }

  const getIconColor = (type: Activity['type']) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-600';
      case 'revenue': return 'bg-green-100 text-green-600';
      case 'expense': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className={getIconColor(activity.type)}>
              <activity.icon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <p className="text-sm font-medium leading-none">{activity.description}</p>
            <p className="text-sm text-muted-foreground truncate">{activity.detail}</p>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: ptBR })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivities;