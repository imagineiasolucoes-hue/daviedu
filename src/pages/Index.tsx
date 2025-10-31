import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, GraduationCap, ArrowRight, Users, DollarSign, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Header: React.FC = () => (
  <header className="w-full py-4 px-6 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-2">
        <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-8" />
        <span className="text-xl font-bold text-primary hidden sm:inline">Davi EDU</span>
      </div>
      <nav className="flex items-center space-x-4">
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Login
        </Link>
        <Button asChild size="sm">
          <Link to="/register">
            Teste Grátis
          </Link>
        </Button>
      </nav>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="w-full py-6 px-6 border-t border-border/50 bg-background">
    <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
      &copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.
    </div>
  </footer>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
                Gestão Escolar <span className="text-primary">Simples</span> e <span className="text-accent">Eficiente</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                O Davi EDU simplifica a administração, finanças e o relacionamento com alunos e pais, permitindo que sua escola foque no que realmente importa: a educação.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button asChild size="lg" className="text-lg px-8 py-6">
                  <Link to="/register">
                    Iniciar Teste Grátis de 7 Dias
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Link to="/pre-matricula">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Link de Pré-Matrícula
                  </Link>
                </Button>
              </div>
            </div>

            {/* Image/Mockup */}
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/dashboard-mockup.png" 
                alt="Davi EDU Dashboard Mockup" 
                className="w-full max-w-xl rounded-xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </section>

        {/* Feature Section Placeholder (Optional) */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-8">Nossas Soluções</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-card rounded-lg shadow-md space-y-3">
                <Users className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold text-lg">Gestão de Alunos</h3>
                <p className="text-sm text-muted-foreground">Controle completo de matrículas, turmas e informações acadêmicas.</p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-md space-y-3">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold text-lg">Controle Financeiro</h3>
                <p className="text-sm text-muted-foreground">Gerencie receitas, despesas e folha de pagamento de forma integrada.</p>
              </div>
              <div className="p-6 bg-card rounded-lg shadow-md space-y-3">
                <BookOpen className="h-8 w-8 text-accent mx-auto" />
                <h3 className="font-semibold text-lg">Organização Acadêmica</h3>
                <p className="text-sm text-muted-foreground">Planejamento de cursos, turmas e eventos escolares.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;