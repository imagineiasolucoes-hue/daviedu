import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Users, UserCheck, BookOpen } from 'lucide-react';

interface SystemUsageOverviewProps {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

const SystemUsageOverview: React.FC<SystemUsageOverviewProps> = ({
  totalStudents,
  totalTeachers,
  totalClasses,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Gauge className="h-5 w-5 text-accent" />
          Uso Geral do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" /> Alunos Ativos:</span>
          <span className="font-bold text-foreground">{totalStudents}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-muted-foreground"><UserCheck className="h-4 w-4" /> Professores Ativos:</span>
          <span className="font-bold text-foreground">{totalTeachers}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4" /> Turmas Cadastradas:</span>
          <span className="font-bold text-foreground">{totalClasses}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          *Métricas de uso mais detalhadas (ex: logins, interações) podem ser adicionadas com telemetria.
        </p>
      </CardContent>
    </Card>
  );
};

export default SystemUsageOverview;