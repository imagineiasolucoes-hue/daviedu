import React, { useState } from "react";
import {
  GraduationCap,
  Building,
  BookMarked,
  Languages,
  Quote,
  Banknote,
  ClipboardList,
  BookCheck,
  Megaphone,
  Loader2,
  Check,
  Instagram, // Importando o ícone do Instagram
  Facebook,  // Importando o ícone do Facebook
  Linkedin,  // Importando o ícone do LinkedIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import usePageTitle from "@/hooks/usePageTitle";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

const WHATSAPP_NUMBER = "5571992059840";
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre o sistema Davi EDU.";
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const features = [
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: "Matrículas Online",
    description: "Simplifique o processo de matrícula com um formulário público e personalizável.",
    advantages: [
      "Reduza a papelada e o trabalho manual.",
      "Link compartilhável para pré-matrícula.",
      "Acompanhe novas inscrições em tempo real.",
    ],
  },
  {
    icon: <Banknote className="h-8 w-8 text-primary" />,
    title: "Gestão Financeira",
    description: "Controle receitas, despesas e a folha de pagamento de forma integrada e intuitiva.",
    advantages: [
      "Visão clara do fluxo de caixa.",
      "Relatórios detalhados de receitas e despesas.",
      "Geração simplificada da folha de pagamento.",
    ],
  },
  {
    icon: <BookCheck className="h-8 w-8 text-primary" />,
    title: "Boletim Virtual (Em breve)",
    description: "Disponibilize notas e frequência online para fácil acesso de pais e alunos.",
    advantages: [
      "Acesso rápido e seguro para pais e alunos.",
      "Redução de custos com impressão.",
      "Histórico acadêmico sempre disponível.",
    ],
  },
  {
    icon: <Megaphone className="h-8 w-8 text-primary" />,
    title: "Comunicação Integrada (Em breve)",
    description: "Envie comunicados e gerencie a agenda escolar, fortalecendo a relação com a comunidade.",
    advantages: [
      "Centralize os comunicados em um único local.",
      "Envie avisos para turmas ou toda a escola.",
      "Agenda de eventos e atividades integrada.",
    ],
  },
];

const targetAudiences = [
  {
    icon: <Building className="h-10 w-10 text-primary" />,
    title: "Escolas",
    description: "Gestão completa para ensino infantil, fundamental e médio.",
  },
  {
    icon: <BookMarked className="h-10 w-10 text-primary" />,
    title: "Cursos Livres",
    description: "Flexibilidade para administrar cursos de curta duração e profissionalizantes.",
  },
  {
    icon: <Languages className="h-10 w-10 text-primary" />,
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
  usePageTitle("Bem-vindo");
  const { session, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O SessionContextProvider irá detectar a mudança de estado e redirecionar para /dashboard
    } catch (err: any) {
      const errorMessage = err.message === "Invalid login credentials" 
        ? "Email ou senha inválidos." 
        : "Ocorreu um erro. Tente novamente.";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
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
            <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-12" />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">Funcionalidades</a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Fale Conosco</a>
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
        <section className="w-full py-20 md:py-24">
            <div className="container mx-auto grid gap-10 lg:grid-cols-2 lg:gap-12 px-4 items-center">
                <div className="flex flex-col justify-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                        O Sistema de Gestão Escolar que sua instituição merece
                    </h1>
                    <p className="max-w-[600px] text-lg text-gray-600">
                        Modernize sua gestão, otimize processos e melhore a comunicação entre escola, alunos e responsáveis.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" asChild>
                            <Link to="/register">Solicitar Acesso Gratuito</Link>
                        </Button>
                    </div>
                </div>
                <Card className="w-full max-w-md mx-auto shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
                    <CardDescription>
                      Já faz parte? Entre com seu email e senha.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button className="w-full" type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                      </Button>
                      <p className="text-center text-sm text-gray-600">
                        Ainda não tem uma conta?{' '}
                        <Link to="/register" className="font-semibold text-primary hover:underline">
                          Solicite seu acesso
                        </Link>
                      </p>
                    </CardFooter>
                  </form>
                </Card>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Ferramentas poderosas para sua gestão</h2>
              <p className="text-gray-600 mt-2">Tudo o que você precisa em um só lugar.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3 text-left pl-1">
                    {feature.advantages.map((advantage, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section id="target-audience" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Perfeito para sua instituição de ensino</h2>
              <p className="text-gray-600 mt-2">Uma solução flexível que se adapta à sua realidade.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {targetAudiences.map((target) => (
                <div key={target.title} className="flex flex-col items-center text-center p-6 bg-white rounded-lg border transition-shadow hover:shadow-lg">
                  {target.icon}
                  <h3 className="mt-4 text-xl font-semibold">{target.title}</h3>
                  <p className="mt-2 text-gray-600">{target.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-gray-50 py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold">O que nossos clientes dizem</h2>
                    <p className="text-gray-600 mt-2">A satisfação de quem já transformou sua gestão.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                    {testimonials.map((testimonial) => (
                        <Card key={testimonial.author} className="bg-white">
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
        <section className="bg-primary text-primary-foreground">
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
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.</p>
          <div className="flex gap-4 items-center">
            <a href="#" className="text-sm text-gray-500 hover:text-primary">Termos de Serviço</a>
            <a href="#" className="text-sm text-gray-500 hover:text-primary">Política de Privacidade</a>
            <div className="flex gap-3 ml-4"> {/* Links para redes sociais */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
      
      <WhatsAppButton />
    </div>
  );
};

export default LandingPage;