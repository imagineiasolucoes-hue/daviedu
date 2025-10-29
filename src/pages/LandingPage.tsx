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
  Instagram,
  Facebook,
  Linkedin,
  Menu,
  DollarSign,
  BarChart,
  MessageSquare,
  Lightbulb,
  Tag,
  LifeBuoy,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck, // Para segurança de dados
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WHATSAPP_NUMBER = "5571992059840";
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre o sistema Davi EDU.";
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const features = [
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: "Matrículas Online Simplificadas",
    description: "Reduza a burocracia e o tempo gasto com processos manuais. Ofereça um formulário de pré-matrícula online, fácil de usar e acessível a todos.",
    advantages: [
      "Formulário público e personalizável.",
      "Redução de papelada e erros.",
      "Acompanhamento de novas inscrições em tempo real.",
    ],
  },
  {
    icon: <Banknote className="h-8 w-8 text-primary" />,
    title: "Gestão Financeira Automatizada",
    description: "Tenha controle total sobre as finanças da sua escola. Gerencie receitas, despesas e folha de pagamento de forma integrada e intuitiva.",
    advantages: [
      "Visão clara do fluxo de caixa.",
      "Relatórios detalhados para decisões estratégicas.",
      "Geração simplificada da folha de pagamento.",
    ],
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Relatórios em Tempo Real",
    description: "Acesse dados e análises importantes a qualquer momento. Tenha insights valiosos para uma tomada de decisão rápida e eficiente.",
    advantages: [
      "Dashboards intuitivos com indicadores chave.",
      "Relatórios financeiros e acadêmicos.",
      "Informações atualizadas para planejamento ágil.",
    ],
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: "Interface Simples e Intuitiva",
    description: "Desenvolvido para ser fácil de usar por toda a equipe. Menos tempo com treinamento, mais tempo com o que realmente importa: a educação.",
    advantages: [
      "Design moderno e responsivo.",
      "Navegação clara e organizada.",
      "Redução de erros operacionais.",
    ],
  },
];

const differentials = [
  {
    icon: <Tag className="h-10 w-10 text-primary" />,
    title: "Preço Acessível",
    description: "Solução completa com planos flexíveis que cabem no orçamento de escolas médias e pequenas.",
  },
  {
    icon: <LifeBuoy className="h-10 w-10 text-primary" />,
    title: "Suporte Brasileiro Dedicado",
    description: "Conte com uma equipe de suporte local, pronta para ajudar com agilidade e eficiência.",
  },
  {
    icon: <RefreshCw className="h-10 w-10 text-primary" />,
    title: "Atualizações Contínuas",
    description: "Seu sistema sempre atualizado com as últimas funcionalidades e melhorias, sem custo adicional.",
  },
];

const faqs = [
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, nossos planos são mensais e você pode cancelar a qualquer momento, sem multas ou burocracia. Sua satisfação é nossa prioridade."
  },
  {
    question: "Quantos usuários podem ter acesso ao sistema?",
    answer: "O plano inclui usuários ilimitados."
  },
  {
    question: "O suporte técnico está incluído na assinatura?",
    answer: "Sim, todos os nossos planos incluem suporte técnico dedicado em português, via chat e e-mail, para garantir que você aproveite ao máximo o DaviEDU."
  },
  {
    question: "Como funciona o teste grátis?",
    answer: "Ao clicar em 'Teste grátis', você será direcionado para um cadastro rápido. Após o cadastro, você terá acesso total ao sistema por 7 dias, sem compromisso e sem a necessidade de cartão de crédito."
  },
];

const LandingPage = () => {
  usePageTitle("DaviEDU - Gestão Escolar");
  const { session, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

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

          {/* Desktop Navigation and Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-primary">Funcionalidades</a>
              <a href="#why-us" className="text-sm font-medium text-gray-600 hover:text-primary">Por que DaviEDU?</a>
              {/* <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-primary">Depoimentos</a> */}
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-primary">Planos</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Fale Conosco</a>
              </Button>
              <Button asChild>
                <Link to="/register">Teste Grátis</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-auto">
                <nav className="flex flex-col gap-4 p-4">
                  <Button asChild className="w-full">
                    <Link to="/register">Teste Grátis</Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">Fale Conosco</a>
                  </Button>
                  <a href="#features" className="block py-2 text-center text-lg font-medium text-gray-700 hover:text-primary">Funcionalidades</a>
                  <a href="#why-us" className="block py-2 text-center text-lg font-medium text-gray-700 hover:text-primary">Por que DaviEDU?</a>
                  {/* <a href="#testimonials" className="block py-2 text-center text-lg font-medium text-gray-700 hover:text-primary">Depoimentos</a> */}
                  <a href="#pricing" className="block py-2 text-center text-lg font-medium text-gray-700 hover:text-primary">Planos</a>
                  <div className="flex justify-center gap-6 mt-4 border-t pt-4">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                      <Instagram className="h-6 w-6" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary">
                      <Linkedin className="h-6 w-6" />
                    </a>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-24 bg-gradient-to-b from-white to-blue-50">
          <div className="container mx-auto grid gap-10 lg:grid-cols-2 lg:gap-12 px-4 items-center">
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-gray-900">
                Controle total da sua escola em um só lugar
              </h1>
              <p className="max-w-[600px] text-lg text-gray-700 mx-auto lg:mx-0">
                Assinatura mensal – sem burocracia. Simples, rápido e inteligente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white">
                  <Link to="/register">Teste Grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#pricing">Ver Planos</a>
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-xl mx-auto lg:mx-0">
              {/* Mockup do Dashboard */}
              <Card className="w-full bg-white shadow-xl border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                  <CardTitle className="text-lg font-semibold text-primary">DaviEDU Dashboard</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Alunos Ativos</span>
                      <span className="text-xl font-bold text-blue-900">250</span>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Receita Mês</span>
                      <span className="text-xl font-bold text-green-900">R$ 50.000</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md h-32 flex items-center justify-center text-gray-400">
                    <BarChart className="h-16 w-16" />
                    <span className="ml-4 text-lg">Gráfico de Matrículas</span>
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Visão geral em tempo real da sua escola.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefícios Destacados Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Transforme a gestão da sua escola</h2>
              <p className="text-gray-700 mt-2 max-w-2xl mx-auto">
                Descubra como o DaviEDU simplifica o dia a dia da sua instituição, otimizando processos e melhorando a comunicação.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="flex flex-col p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg">
                  <CardHeader className="p-0 pb-4 flex flex-row items-center gap-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <p className="mt-1 text-gray-600">{feature.description}</p>
                    <ul className="mt-6 space-y-3 text-left pl-1">
                      {feature.advantages.map((advantage, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{advantage}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais Competitivos / Por que nos escolher Section */}
        <section id="why-us" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Por que escolher DaviEDU?</h2>
              <p className="text-gray-700 mt-2 max-w-2xl mx-auto">
                Nossa plataforma é construída pensando nas necessidades reais da sua escola, oferecendo vantagens que você não encontra em outras soluções.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              {differentials.map((diff) => (
                <Card key={diff.title} className="flex flex-col items-center text-center p-6 bg-white rounded-lg border transition-shadow hover:shadow-lg">
                  <CardHeader className="p-0 pb-4">{diff.icon}</CardHeader>
                  <CardTitle className="mt-4 text-xl font-semibold">{diff.title}</CardTitle>
                  <CardDescription className="mt-2 text-gray-600">{diff.description}</CardDescription>
                </Card>
              ))}
            </div>

            {/* Comparativo Simples */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">DaviEDU vs. Soluções Tradicionais</h3>
              <p className="text-gray-700 mt-2">Veja como somos diferentes.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              <Card className="bg-red-50 border-red-200 shadow-lg">
                <CardHeader className="text-center">
                  <Clock className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <CardTitle className="text-2xl text-red-700">Software Antigo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-700">
                  <p className="flex items-center gap-2"><span className="text-red-500 font-bold text-xl">×</span> Burocracia e papelada</p>
                  <p className="flex items-center gap-2"><span className="text-red-500 font-bold text-xl">×</span> Relatórios desatualizados</p>
                  <p className="flex items-center gap-2"><span className="text-red-500 font-bold text-xl">×</span> Interface complexa e lenta</p>
                  <p className="flex items-center gap-2"><span className="text-red-500 font-bold text-xl">×</span> Altos custos de manutenção</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200 shadow-lg">
                <CardHeader className="text-center">
                  <Sparkles className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <CardTitle className="text-2xl text-green-700">DaviEDU Moderno</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-gray-700">
                  <p className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Processos digitais e ágeis</p>
                  <p className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Dados em tempo real</p>
                  <p className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Design intuitivo e responsivo</p>
                  <p className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" /> Custo-benefício imbatível</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Oferta/Promoção Especial Section */}
        <section className="bg-accent text-white py-20 text-center">
          <div className="container mx-auto px-4">
            <div className="relative inline-block bg-white text-accent px-6 py-2 rounded-full text-lg font-bold mb-6 shadow-lg">
              OFERTA DE LANÇAMENTO!
            </div>
            <h2 className="text-4xl font-bold mb-4">7 Dias Gratuitos!</h2>
            <p className="text-lg max-w-3xl mx-auto mb-8">
              Experimente o DaviEDU por 7 dias sem custo e descubra como podemos revolucionar a gestão da sua escola. Sem compromisso, sem cartão de crédito.
            </p>
            <Button size="lg" asChild className="bg-white text-accent hover:bg-gray-100 text-xl px-8 py-6">
              <Link to="/register">Comece seu Teste Grátis Agora! <ArrowRight className="ml-3 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>

        {/* Preço / Planos claros Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Plano Flexível para sua Escola</h2>
              <p className="text-gray-700 mt-2 max-w-2xl mx-auto">
                Um plano completo que se adapta às necessidades da sua instituição.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-1 max-w-2xl mx-auto mb-16">
              {/* Plano Completo */}
              <Card className="flex flex-col border-2 border-primary shadow-lg relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-sm font-bold">
                  PLANO ÚNICO
                </div>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-3xl font-bold text-primary">Plano Completo</CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Solução completa para escolas que buscam excelência e eficiência.
                  </CardDescription>
                  <p className="text-5xl font-extrabold text-gray-900 mt-4">R$ 220<span className="text-xl font-medium text-gray-600">/mês</span></p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 px-6">
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Gestão de Alunos e Turmas</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Matrículas Online</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Gestão Financeira Completa (Receitas/Despesas)</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Folha de Pagamento</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Relatórios Financeiros Avançados</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Usuários Administradores Ilimitados</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Módulos Pedagógico e Comunicação (Em breve)</p>
                  <p className="flex items-center gap-2 text-gray-700"><Check className="h-5 w-5 text-green-500" /> Suporte Dedicado via Chat e Email</p>
                </CardContent>
                <CardFooter className="p-6 pt-4">
                  <Button asChild className="w-full bg-accent hover:bg-accent/90 text-white text-lg py-6">
                    <Link to="/register">Assine Agora</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Perguntas Frequentes (FAQ) */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Perguntas Frequentes</h3>
              <p className="text-gray-700 mt-2">Tire suas dúvidas sobre o DaviEDU.</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-lg text-gray-800 hover:no-underline">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-gray-700">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
            <p className="text-xl font-bold mt-6 mb-8">
              Mais de 50 escolas já confiam no DaviEDU!
            </p>
            <div className="mt-8">
              <Button size="lg" variant="secondary" asChild className="text-xl px-8 py-6">
                <Link to="/register">Comece Agora Gratuitamente <ArrowRight className="ml-3 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-100">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row">
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.</p>
          <div className="flex gap-4 items-center">
            <a href="#" className="text-sm text-gray-600 hover:text-primary">Termos de Serviço</a>
            <a href="#" className="text-sm text-gray-600 hover:text-primary">Política de Privacidade</a>
            <div className="flex gap-3 ml-4">
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
            {/* Selo de segurança de dados - Placeholder */}
            <div className="ml-4 flex items-center gap-2 text-gray-500">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm">Dados Seguros</span>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
};

export default LandingPage;