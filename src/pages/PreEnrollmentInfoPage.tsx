import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link2Off } from 'lucide-react';

const PreEnrollmentInfoPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Link2Off className="h-8 w-8 text-primary" />
            Link de Pré-Matrícula
          </CardTitle>
          <CardDescription>
            Esta é a página de pré-matrícula do sistema Davi EDU.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Para realizar uma pré-matrícula, você precisa usar o link exclusivo fornecido pela escola.
          </p>
          <p className="text-sm">
            Se você é o administrador de uma escola, acesse seu painel para copiar o link correto e compartilhá-lo.
          </p>
          <Button asChild>
            <Link to="/">Voltar à Página Inicial</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreEnrollmentInfoPage;