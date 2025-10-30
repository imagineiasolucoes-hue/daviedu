import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Register = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>O formulário de cadastro será reconstruído aqui.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            A lógica de criação de usuário e tenant será reintroduzida.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar para o Início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;