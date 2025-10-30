import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const FinancePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Visão Geral Financeira</h1>
        <DollarSign className="h-8 w-8 text-primary" />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui será exibido o resumo financeiro, balanços e gráficos de fluxo de caixa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancePage;