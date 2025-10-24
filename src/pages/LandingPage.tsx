import {
  GraduationCap,
  School,
  ShieldCheck,
  Building,
  BookMarked,
  Languages,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const targetAudiences = [
  {
    icon: <Building className="h-10 w-10 text-blue-600" />,
    title: "Escolas",
    description: "Gestão completa para ensino infantil, fundamental e médio.",
  },
  {
    icon: <BookMarked className="h-10 w-10 text-blue-600" />,
    title: "Cursos Livres",
    description: "Flexibilidade para administrar cursos de curta duração e profissionalizantes.",
  },
  {
    icon: <Languages className="h-10 w-10 text-blue-600" />,
    title: "Cursos de Idiomas",
    description: "Ferramentas específicas para o gerenciamento de turmas e níveis.",
  },
];

const testimonials = [
    {
        quote: "A implementação do sistema transformou nossa secretaria. Os processos estão muito mais ágeis e a comunicação com os pais melhorou 100%.",
        author: "Maria Almeida",
        role: "Diretora, Colégio Aprender",
        avatar: "MA"
    },
    {
        quote: "Finalmente encontramos uma solução que entende as necessidades de um curso profissionalizante. O controle financeiro é simples e eficiente.",
        author: "João Costa",
        role: "Coordenador, Cursos Tech",
        avatar: "JC"
    }
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
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-blue-600">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link to="/register">Comece Agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32">
            <div className="container mx-auto grid gap-6 lg:grid-cols-2 lg:gap-12 px-4">
                <div className="flex flex-col justify-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
                        O Sistema de Gestão Escolar que sua instituição merece
                    </h1>
                    <p className="max-w-[600px] text-lg text-gray-600">
                        Modernize sua gestão, otimize processos e melhore a comunicação entre escola, alunos e responsáveis.
                    </p>
                    <div className="w-full max-w-sm space-x-2">
                        <Button size="lg" asChild>
                            <Link to="/register">Experimente Grátis</Link>
                        </Button>
                    </div>
                </div>
                <img
                    src="/placeholder.svg"
                    width="550"
                    height="550"
                    alt="Hero"
                    className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                />
            </div>
        </section>

        {/* Target Audience Section */}
        <section id="target-audience" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Perfeito para sua instituição de ensino</h2>
              <p className="text-gray-600 mt-2">Uma solução flexível que se adapta à sua realidade.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {targetAudiences.map((target) => (
                <div key={target.title} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md transition-transform hover:scale-105">
                  {target.icon}
                  <h3 className="mt-4 text-xl font-semibold">{target.title}</h3>
                  <p className="mt-2 text-gray-600">{target.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">O que nossos clientes dizem</h2>
                    <p className="text-gray-600 mt-2">A satisfação de quem já transformou sua gestão.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.author} className="bg-gray-50">
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    <Quote className="h-8 w-8 text-gray-300" />
                                    <p className="text-lg text-gray-700">"{testimonial.quote}"</p>
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.author}</p>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-blue-600 text-white">
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-3xl font-bold">Pronto para modernizar sua gestão?</h2>
                <p className="mt-4 max-w-2xl mx-auto">
                    Junte-se a centenas de instituições que já otimizaram seus processos com nossa plataforma.
                </p>
                <div className="mt-8">
                    <Button size="lg" variant="secondary" asChild>
                        <Link to="/register">Comece Agora Gratuitamente</Link>
                    </Button>
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