import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Dados mockados para o gráfico de crescimento
const mockGrowthData = [
  { name: 'Jan', Escolas: 4 },
  { name: 'Fev', Escolas: 7 },
  { name: 'Mar', Escolas: 12 },
  { name: 'Abr', Escolas: 15 },
  { name: 'Mai', Escolas: 20 },
  { name: 'Jun', Escolas: 25 },
];

const SchoolGrowthChart: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Crescimento de Escolas (Últimos 6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-2 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={mockGrowthData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: '0.5rem' 
              }}
            />
            <Line type="monotone" dataKey="Escolas" stroke="hsl(142.1 76.2% 36.3%)" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SchoolGrowthChart;