import { GraduationCap, School, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";

const features = [
  {
    icon: <School className="h-10 w-10 text-blue-600" />,
    title: "Gestão Acadêmica Completa",
    description: "Gerencie alunos, turmas, matrículas, notas e frequência em um só lugar.",
  },
  {
    icon: <GraduationCap className="h-10 w-10 text-blue-600" />,
    title: "Portal do Aluno e Responsável",
    description: "Ofereça acesso fácil a informações acadêmicas e financeiras para toda a comunidade escolar.",
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-blue-600" />,
    title: "Segurança e Multi-Tenancy",
    description: "Dados isolados e seguros para cada escola, garantindo total privacidade e controle.",
  },
];

const LandingPage = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <GraduationCap className="h-7 w-7 text-blue-600" />
            <span>Gestão Escolar</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600">Preços</a>
            <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-blue-600">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Comece Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              O Sistema de Gestão Escolar que sua instituição merece
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Modernize sua gestão, otimize processos e melhore a comunicação entre escola, alunos e responsáveis.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link to="/register">Experimente Grátis</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Tudo que você precisa para gerenciar sua escola</h2>
              <p className="text-gray-600 mt-2">Funcionalidades pensadas para facilitar o dia a dia.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
                  {feature.icon}
                  <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Gestão Escolar. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-gray-500 hover:text-blue-600">Termos de Serviço</a>
            <a href="#" className="text-sm text-gray-500 hover:text-blue-600">Política de Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;