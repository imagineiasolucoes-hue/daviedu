import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Clock, BarChart, Users, DollarSign, MessageSquare, ShieldCheck, Zap, Cloud, Star, Phone, Mail, Instagram, Facebook, HelpCircle } from 'lucide-react'; // Adicionado HelpCircle
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FloatingConsultantButton from '@/components/FloatingConsultantButton';

const Header: React.FC = () => (
  <header className="w-full py-4 px-6 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-8" />
      </Link>
      <nav className="flex items-center space-x-2 sm:space-x-4">
        <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
          <Link to="/login">
            Login
          </Link>
        </Button>
        <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
          <Link to="/register">
            Iniciar Teste Grátis
          </Link>
        </Button>
      </nav>
    </div>
  </header>
);

const Footer: React.FC = () => (
  <footer className="w-full py-12 px-6 border-t border-border/50 bg-muted/50">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
      <div>
        <img src="/logo-retangular.png" alt="Davi EDU Logo" className="h-8 mx-auto md:mx-0 mb-4" />
        <p className="text-sm text-muted-foreground">DaviEDU — Simplificando a gestão escolar.</p>
      </div>
      <div className="text-sm text-muted-foreground">
        <h4 className="font-semibold text-foreground mb-2">Contato</h4>
        <p><a href="mailto:imagineiasolucoes@gmail.com" className="hover:text-primary">imagineiasolucoes@gmail.com</a></p>
        <p><a href="https://wa.me/5571992059840" target="_blank" rel="noopener noreferrer" className="hover:text-primary">(71) 99205-9840</a></p>
      </div>
      <div className="text-sm">
        <h4 className="font-semibold text-foreground mb-2">Siga-nos</h4>
        <div className="flex justify-center md:justify-start space-x-4 mb-2">
          <a href="#" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></a>
          <a href="#" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></a>
        </div>
        <h4 className="font-semibold text-foreground mb-2">Recursos</h4>
        <p><Link to="/faq" className="hover:text-primary">Dúvidas Frequentes (FAQ)</Link></p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Davi EDU. Todos os direitos reservados.</p>
      <p className="mt-2">
        <Link to="/privacy" className="hover:text-primary">Política de Privacidade</Link> | <Link to="/terms" className="hover:text-primary">Termos de Uso</Link>
      </p>
    </div>
  </footer>
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        {/* 1. Hero Section */}
        <section className="py-16 md:py-24 px-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                  A Gestão Escolar que <span className="text-accent">Liberta sua Secretaria</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  O DaviEDU centraliza matrícula, notas, financeiro e comunicação. Solução completa, preço fixo e justo para escolas pequenas e médias.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Button asChild size="lg" className="text-lg px-8 py-6 bg-accent hover:bg-accent/90">
                    <Link to="/register">
                      Comece seu Teste Grátis de 7 Dias
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary/10">
                    <a href="#pricing">
                      Ver Preço Fixo
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground pt-2">Sem fidelidade. Sem custos escondidos. Sem complicação.</p>
              </div>
              <div className="lg:w-1/2 flex justify-center lg:justify-end">
                <img 
                  src="/dashboard-mockup.png" 
                  alt="Davi EDU Dashboard Mockup" 
                  className="w-full h-auto rounded-xl shadow-2xl border border-border/50 object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Benefícios Rápidos */}
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Clock className="h-10 w-10 text-accent" />
              <p className="font-semibold">Redução de 40% no tempo administrativo</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <DollarSign className="h-10 w-10 text-accent" />
              <p className="font-semibold">Controle financeiro total e intuitivo</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-10 w-10 text-accent" />
              <p className="font-semibold">Portal do Aluno e Responsável</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <BarChart className="h-10 w-10 text-accent" />
              <p className="font-semibold">Relatórios acadêmicos e financeiros</p>
            </div>
          </div>
        </section>

        {/* 3. Por que escolher o DaviEDU? */}
        <section className="py-16 md:py-24 px-4 bg-muted/50">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">O DaviEDU é a solução que sua escola estava esperando.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: DollarSign, title: "Preço Fixo e Acessível", desc: "R$ 220/mês. Sem surpresas, sem limites de alunos ou usuários." },
                { icon: Zap, title: "Ativação Imediata", desc: "Comece a usar em minutos. Implantação rápida e sem dor de cabeça." },
                { icon: MessageSquare, title: "Suporte Premium via WhatsApp", desc: "Atendimento direto e humanizado para resolver tudo rapidamente." },
                { icon: Users, title: "Feito para o seu porte", desc: "Foco total em escolas pequenas e médias, com funcionalidades essenciais." },
                { icon: Cloud, title: "Segurança e Acesso Total", desc: "Sistema 100% em nuvem, acessível de qualquer dispositivo, com dados protegidos." },
                { icon: ShieldCheck, title: "Liberdade Contratual", desc: "Sem fidelidade. Cancele a qualquer momento, de forma simples e transparente." },
              ].map(item => (
                <div key={item.title} className="p-6 bg-card rounded-lg text-left flex items-start gap-4">
                  <item.icon className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Como funciona */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">Sua escola organizada em 4 passos</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { num: 1, title: "Inicie o Teste Grátis", desc: "Cadastre sua escola e comece a usar o sistema em segundos." },
                { num: 2, title: "Configure o Básico", desc: "Defina turmas, séries e cadastre seus professores e alunos." },
                { num: 3, title: "Centralize as Operações", desc: "Use o sistema para lançar notas, gerenciar o financeiro e emitir documentos." },
                { num: 4, title: "Foque no Ensino", desc: "Com a gestão automatizada, sua equipe tem mais tempo para o que realmente importa: a educação." },
              ].map(step => (
                <div key={step.num} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-bold mb-4">{step.num}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Depoimentos */}
        <section className="py-16 md:py-24 px-4 bg-muted/50">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">O que outras escolas dizem</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-left">
                <CardContent className="pt-6">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="italic text-muted-foreground">"Com o DaviEDU, reduzimos 40% do tempo da secretaria. É simples e completo!"</p>
                  <div className="mt-4 flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4"><Users/></div>
                    <div>
                      <p className="font-semibold">Maria Souza, Diretora</p>
                      <p className="text-sm text-muted-foreground">Escola Pequenos Gênios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="pt-6">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="italic text-muted-foreground">"O controle financeiro ficou muito mais fácil. Agora sei exatamente onde estamos."</p>
                  <div className="mt-4 flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4"><Users/></div>
                    <div>
                      <p className="font-semibold">João Pereira, Gestor</p>
                      <p className="text-sm text-muted-foreground">Colégio Aprender Mais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-left">
                <CardContent className="pt-6">
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                  </div>
                  <p className="italic text-muted-foreground">"O suporte via WhatsApp é um diferencial. Sempre que precisei, fui atendido na hora."</p>
                  <div className="mt-4 flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4"><Users/></div>
                    <div>
                      <p className="font-semibold">Ana Costa, Secretária</p>
                      <p className="text-sm text-muted-foreground">Instituto Crescer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 6. Preço */}
        <section id="pricing" className="py-16 md:py-24 px-4">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Preço simples e transparente</h2>
            <Card className="mt-8 shadow-lg">
              <CardHeader>
                <p className="text-5xl font-bold text-primary">R$ 220<span className="text-xl font-normal text-muted-foreground">/mês</span></p>
                <p className="text-muted-foreground">Sem taxas extras. Sem surpresas. Sem limite de usuários.</p>
              </CardHeader>
              <CardContent className="space-y-4 text-left">
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Gestão acadêmica completa</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Controle financeiro (Receitas e Despesas)</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Portal do Aluno e Responsável</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Suporte Premium via WhatsApp</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Backup diário e seguro</li>
                </ul>
                <div className="space-y-3 pt-2">
                  <Button asChild size="lg" className="w-full text-lg bg-kiwify hover:bg-kiwify/90 text-white">
                    <a href="https://pay.kiwify.com.br/TCQFp8O" target="_blank" rel="noopener noreferrer">
                      Assinar Agora
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full text-lg">
                    <Link to="/register">
                      Iniciar teste grátis de 7 dias
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="py-16 md:py-24 px-4 bg-muted/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">Perguntas Frequentes</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Preciso instalar algo?</AccordionTrigger>
                <AccordionContent>Não. O DaviEDU é 100% online. Você só precisa de um navegador de internet e acesso à rede para usar o sistema de qualquer lugar.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Posso cancelar a qualquer momento?</AccordionTrigger>
                <AccordionContent>Sim. Nosso plano não tem fidelidade. Você pode cancelar quando quiser, sem multas ou burocracia.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Quantos usuários posso cadastrar?</AccordionTrigger>
                <AccordionContent>Não há limites de cadastro de alunos, professores ou administradores. O valor é fixo, independente do tamanho da sua escola.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>O sistema é seguro?</AccordionTrigger>
                <AccordionContent>Sim. Usamos as melhores práticas de segurança e servidores em nuvem confiáveis para garantir que seus dados estejam sempre protegidos.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>Tem suporte por WhatsApp?</AccordionTrigger>
                <AccordionContent>Sim! Oferecemos suporte rápido e direto via WhatsApp para resolver qualquer dúvida ou problema que você tenha no dia a dia.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>O que acontece após o teste grátis?</AccordionTrigger>
                <AccordionContent>Após 7 dias, se você não assinar, seu acesso será suspenso. Seus dados serão mantidos por um período, mas você precisará regularizar a assinatura para continuar usando o sistema.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* 9. Chamada Final */}
        <section className="py-20 md:py-24 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Pronto para simplificar a gestão da sua escola?</h2>
            <Button asChild size="lg" className="text-lg px-10 py-7 bg-accent hover:bg-accent/90">
              <Link to="/register">Iniciar teste grátis de 7 dias</Link>
            </Button>
            <p className="text-muted-foreground mt-4">Sem fidelidade. Experimente e decida depois.</p>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingConsultantButton />
    </div>
  );
};

export default Index;