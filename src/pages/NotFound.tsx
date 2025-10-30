import React from 'react';
import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <Frown className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold mb-2 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
        <Button asChild>
          <Link to="/">Retornar à Página Inicial</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;