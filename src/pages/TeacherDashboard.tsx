import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, GraduationCap, CalendarDays, BookOpen, Settings, HelpCircle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Loader2 } from 'lucide-react';

const teacherActions = [
  {
    label: 'Lançamento de Notas',
    icon: GraduationCap,
    to: '/grades/entry',
    description: 'Registre notas e avaliações dos alunos nas suas turmas.',
    variant: 'default' as const,
  },
  {
    label: 'Calendário Acadêmico',
    icon: CalendarDays,
    to: '/calendar',
    description: 'Visualize eventos, feriados e datas importantes da escola.',
    variant: 'outline' as const,
  },
  // Ações futuras podem ser adicionadas aqui, como 'Minhas Turmas' ou 'Diário de Classe'
];

const TeacherDashboard: React.FC = () => {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.first_name || 'Professor(a)';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        Painel do Professor
      </h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo(a), {displayName}!</CardTitle>
          <CardDescription>
            Sua área de trabalho focada nas responsabilidades acadêmicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Utilize as ações rápidas abaixo para gerenciar suas turmas e lançar notas.
          </p>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            Ações Acadêmicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teacherActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center"
                asChild
              >
                <Link to={action.to}>
                  <action.icon className="h-6 w-6 mb-1 text-muted-foreground" />
                  <span className="font-semibold text-sm">{action.label}</span>
                  {/* A descrição será visível apenas em telas médias e maiores */}
                  <p className="text-xs text-muted-foreground mt-1 hidden md:block">{action.description}</p>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Links de Suporte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline">
                <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações de Perfil
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link to="/faq">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Dúvidas Frequentes (FAQ)
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;