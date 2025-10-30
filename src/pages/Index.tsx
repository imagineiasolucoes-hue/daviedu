import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, UserPlus, GraduationCap } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Davi EDU</CardTitle>
          <p className="text-muted-foreground mt-2">Sistema de Gestão Escolar</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">
            Bem-vindo ao seu portal de gestão escolar.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link to="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Acesso de Administradores/Funcionários
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Escola (Teste Grátis)
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/pre-matricula">
                <GraduationCap className="mr-2 h-4 w-4" />
                Fazer Pré-Matrícula
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;