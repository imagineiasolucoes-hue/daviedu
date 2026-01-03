import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, UserPlus, CalendarDays, FileText, FolderKanban, UserCheck } from 'lucide-react';

const secretaryActions = [
  {
    label: 'Alunos',
    icon: Users,
    to: '/students',
    description: 'Gerenciar fichas e matrículas.',
  },
  {
    label: 'Professores',
    icon: UserCheck,
    to: '/teachers',
    description: 'Gerenciar corpo docente.',
  },
  {
    label: 'Turmas',
    icon: BookOpen,
    to: '/classes',
    description: 'Organizar turmas e alocações.',
  },
  {
    label: 'Pré-Matrículas',
    icon: UserPlus,
    to: '/students', // Idealmente, levaria a uma visão filtrada
    description: 'Aprovar novas solicitações.',
  },
  {
    label: 'Documentos',
    icon: FileText,
    to: '/documents',
    description: 'Gerenciar arquivos e documentos.',
  },
];

const SecretaryDashboardSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" />
          Secretaria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {secretaryActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center"
              asChild
            >
              <Link to={action.to}>
                <action.icon className="h-6 w-6 mb-1 text-muted-foreground" />
                <span className="font-semibold text-sm">{action.label}</span>
                <p className="text-xs text-muted-foreground hidden md:block">{action.description}</p>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecretaryDashboardSection;