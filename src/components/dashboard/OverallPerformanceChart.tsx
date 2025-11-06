import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

interface SubjectPerformance {
  subject_name: string;
  average_grade: number;
}

const fetchOverallPerformance = async (tenantId: string): Promise<SubjectPerformance[]> => {
  const { data, error } = await supabase.functions.invoke('get-overall-performance-metrics', {
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  if (error) throw new Error(error.message);
  // @ts-ignore
  if (data.error) throw new Error(data.error);
  return data as SubjectPerformance[];
};

const OverallPerformanceChart: React.FC = () => {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;

  const { data: performanceData, isLoading, error } = useQuery<SubjectPerformance[], Error>({
    queryKey: ['overallPerformance', tenantId],
    queryFn: () => fetchOverallPerformance(tenantId!),
    enabled: !!tenantId,
  });

  if (isProfileLoading || isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Aproveitamento Geral por Matéria</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Aproveitamento Geral por Matéria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Erro ao carregar dados de aproveitamento: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Aproveitamento Geral por Matéria
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-2 md:p-6">
        {performanceData && performanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={performanceData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="subject_name" stroke="hsl(var(--muted-foreground))" />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                domain={[0, 10]} // Notas de 0 a 10
                tickFormatter={(value: number) => value.toFixed(1)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '0.5rem' 
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}`, 'Média']}
              />
              <Bar dataKey="average_grade" fill="hsl(var(--primary))" name="Média de Notas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum dado de notas encontrado para exibir o aproveitamento.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default OverallPerformanceChart;