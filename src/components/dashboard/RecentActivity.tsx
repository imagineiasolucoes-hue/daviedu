import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UserPlus, DollarSign, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: number;
  type: 'student' | 'revenue' | 'expense';
  description: string;
  time: string;
  detail?: string;
}

// Dados mockados para o layout
const mockActivities: ActivityItem[] = [
  { id: 1, type: 'student', description: 'Novo aluno cadastrado', detail: 'Cristiane', time: 'há 20 minutos' },
  { id: 2, type: 'student', description: 'Novo aluno cadastrado', detail: 'Thiago M.', time: 'há 23 minutos' },
  { id: 3, type: 'student', description: 'Novo aluno cadastrado', detail: 'Bernardo', time: 'há 23 minutos' },
  { id: 4, type: 'student', description: 'Novo aluno cadastrado', detail: 'Gabriel', time: 'há 24 minutos' },
  { id: 5, type: 'student', description: 'Novo aluno cadastrado', detail: 'João Vitor', time: 'há 24 minutos' },
  { id: 6, type: 'revenue', description: 'Nova receita adicionada', detail: 'Farda - R$ 130,00', time: 'há cerca de 7 horas' },
  { id: 7, type: 'revenue', description: 'Nova receita adicionada', detail: 'Livros - R$ 250,00', time: 'há cerca de 8 horas' },
  { id: 8, type: 'expense', description: 'Nova despesa registrada', detail: 'Material de Limpeza - R$ 80,00', time: 'há 1 dia' },
  { id: 9, type: 'student', description: 'Aluno transferido', detail: 'Maria S.', time: 'há 2 dias' },
];

const ActivityIcon: React.FC<{ type: ActivityItem['type'] }> = ({ type }) => {
  let Icon = Activity;
  let colorClass = 'text-muted-foreground';

  switch (type) {
    case 'student':
      Icon = UserPlus;
      colorClass = 'text-primary';
      break;
    case 'revenue':
      Icon = DollarSign;
      colorClass = 'text-green-500';
      break;
    case 'expense':
      Icon = DollarSign; // Usando DollarSign para despesa também, mas com cor diferente
      colorClass = 'text-red-500';
      break;
  }

  return (
    <div className={cn("p-2 rounded-full bg-gray-100 dark:bg-gray-700", colorClass)}>
      <Icon className="h-4 w-4" />
    </div>
  );
};

const RecentActivity: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {mockActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <div className="flex items-start justify-between py-3">
                  <div className="flex items-center gap-3">
                    <ActivityIcon type={activity.type} />
                    <div>
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
                {index < mockActivities.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;