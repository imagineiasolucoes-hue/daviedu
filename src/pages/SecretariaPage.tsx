import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, UserPlus, CalendarDays, FileText, FolderKanban, UserCheck, LayoutDashboard, ClipboardList, GraduationCap } from 'lucide-react'; // Adicionado GraduationCap
import DocumentGenerationPanel from '@/components/documents/DocumentGenerationPanel'; // Importar o painel de geração de documentos

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
    label: 'Matérias',
    icon: ClipboardList,
    to: '/classes/subjects',
    description: 'Gerenciar matérias e tipos de avaliação.',
  },
  {
    label: 'Séries/Anos',
    icon: BookOpen,
    to: '/classes/courses',
    description: 'Definir cursos e séries.',
  },
  {
    label: 'Lançar Notas',
    icon: GraduationCap,
    to: '/grades/entry', // Rota atualizada
    description: 'Registrar avaliações e notas dos alunos.',
  },
  {
    label: 'Calendário',
    icon: CalendarDays,
    to: '/calendar',
    description: 'Ver e gerenciar eventos acadêmicos.',
  },
  {
    label: 'Documentos',
    icon: FileText,
    to: '/documents',
    description: 'Gerenciar arquivos e documentos da escola.',
  },
];

const SecretariaPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <FolderKanban className="h-8 w-8 text-primary" />
        Painel da Secretaria
      </h1>
      <p className="text-muted-foreground">
        Centralize as operações administrativas e acadêmicas da sua escola.
      </p>

      {/* Seção de Geração de Documentos */}
      <DocumentGenerationPanel />

      {/* Seção de Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Acesse as principais funcionalidades da secretaria.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </div>
  );
};

export default SecretariaPage;