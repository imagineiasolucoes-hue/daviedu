import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BarChartData {
  name: string;
  Receita: number;
  Despesa: number;
}

interface BarChartComponentProps {
  data: BarChartData[];
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Fluxo de Caixa Mensal</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-2 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              tickFormatter={(value: number) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '0.5rem' 
              }}
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
            />
            <Legend />
            <Bar dataKey="Receita" fill="hsl(142.1 76.2% 36.3%)" name="Receita" />
            <Bar dataKey="Despesa" fill="hsl(0 84.2% 60.2%)" name="Despesa" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BarChartComponent;