import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Zap, DollarSign } from 'lucide-react';

const KiwifyIntegrationCard: React.FC = () => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-kiwify" />
          Integração Kiwify
        </CardTitle>
        <CardDescription>
          Gerencie assinaturas e pagamentos via Kiwify.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between space-y-4">
        <p className="text-muted-foreground text-sm">
          Esta seção permitirá a visualização e gestão de assinaturas e transações processadas pela Kiwify.
          Futuramente, você poderá ver o status de pagamentos, faturas e gerenciar planos.
        </p>
        <Button asChild className="w-full bg-kiwify hover:bg-kiwify/90">
          <a href="https://kiwify.com.br" target="_blank" rel="noopener noreferrer">
            <Zap className="mr-2 h-4 w-4" />
            Acessar Kiwify
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default KiwifyIntegrationCard;