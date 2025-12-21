"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Phone, Mail, Instagram, Facebook, HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import FloatingConsultantButton from '@/components/FloatingConsultantButton';

const Header: React.FC = () => (
  <header className="w-full py-4 px-6 border-b border-border/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50 print-hidden">
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
  <footer className="w-full py-12 px-6 border-t border-border/50 bg-muted/50 print-hidden">
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
          <a href="https://www.instagram.com/imagineiasolucoes/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></a>
          <a href="https://www.facebook.com/profile.php?id=61582527995208" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></a>
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

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4" />
                Voltar à Página Inicial
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Termos de Uso
            </h1>
          </div>

          <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Introdução</h2>
              <p>
                Bem-vindo(a) ao Davi EDU! Este documento ("Termos de Uso") estabelece os termos e condições que regem o acesso e a utilização da plataforma Davi EDU, um sistema de gestão escolar completo oferecido pela Imagine IA Soluções.
              </p>
              <p>
                Ao acessar, navegar ou utilizar qualquer parte do serviço Davi EDU, você ("Usuário", que pode ser uma escola, administrador, professor, aluno ou responsável) concorda em estar vinculado(a) a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, por favor, não utilize a plataforma.
              </p>
              <p>
                O Davi EDU é operado pela Imagine IA Soluções, com sede em Salvador, Bahia, Brasil.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. Descrição do Serviço</h2>
              <p>
                O Davi EDU é uma plataforma online e baseada em nuvem, projetada para simplificar e otimizar a gestão de instituições de ensino. Nossos serviços incluem, mas não se limitam a:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Gestão Acadêmica (matrículas, turmas, séries/anos, matérias, lançamento de notas, boletins e históricos escolares).</li>
                <li>Controle Financeiro (registro de receitas e despesas, fluxo de caixa, relatórios).</li>
                <li>Gestão de Pessoas (cadastro de professores e funcionários).</li>
                <li>Comunicação Interna e Externa.</li>
                <li>Geração e Armazenamento de Documentos.</li>
                <li>Portal do Aluno e Responsável.</li>
                <li>Sistema de Pré-Matrícula Online.</li>
              </ul>
              <p>
                O Davi EDU está em constante evolução, e novas funcionalidades podem ser adicionadas ou modificadas a qualquer momento para melhorar a experiência do usuário.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. Período de Teste Gratuito (7 Dias)</h2>
              <p>
                Oferecemos um período de teste gratuito de 7 (sete) dias para novas escolas que se cadastrarem na plataforma Davi EDU. Este período tem como objetivo permitir que você explore e avalie as funcionalidades do sistema sem compromisso financeiro.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Início do Teste:</strong> O período de 7 dias começa automaticamente a partir da data de conclusão do seu cadastro como escola (Tenant) na plataforma.
                </li>
                <li>
                  <strong>Acesso:</strong> Durante o período de teste, você terá acesso completo a todas as funcionalidades da plataforma.
                </li>
                <li>
                  <strong>Término do Teste:</strong> Ao final dos 7 dias, seu acesso à plataforma será automaticamente suspenso.
                </li>
                <li>
                  <strong>Transição para Plano Pago:</strong> Para continuar utilizando o Davi EDU após o período de teste, será necessário contratar um de nossos planos pagos. Não há cobrança automática; a transição requer uma ação explícita de sua parte.
                </li>
                <li>
                  <strong>Dados Pós-Teste:</strong> Se você não contratar um plano pago, os dados inseridos durante o período de teste serão mantidos por um período de carência de 30 (trinta) dias. Após este período, se o plano não for ativado, os dados poderão ser permanentemente excluídos de nossos servidores.
                </li>
              </ul>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">4. Assinatura e Pagamento</h2>
              <p>
                Após o período de teste gratuito, o uso contínuo do Davi EDU requer a contratação de um plano de assinatura.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Preço:</strong> O valor da assinatura é fixo em R$ 220,00 (duzentos e vinte reais) por mês, independentemente do número de alunos, professores ou usuários.
                </li>
                <li>
                  <strong>Faturamento:</strong> A cobrança é realizada mensalmente, de forma antecipada, a partir da data de ativação do plano.
                </li>
                <li>
                  <strong>Métodos de Pagamento:</strong> Aceitamos pagamentos via cartão de crédito, PIX e boleto bancário, através de nossa plataforma de pagamentos parceira (Kiwify).
                </li>
                <li>
                  <strong>Ajustes de Preço:</strong> O Davi EDU se reserva o direito de ajustar os preços dos planos de assinatura a qualquer momento, mediante aviso prévio de 30 (trinta) dias aos usuários.
                </li>
                <li>
                  <strong>Inadimplência:</strong> Em caso de falta de pagamento, o acesso à plataforma será suspenso após um período de tolerância. Após 30 (trinta) dias de inadimplência, os dados da escola poderão ser permanentemente excluídos.
                </li>
              </ul>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">5. Cancelamento e Rescisão do Contrato</h2>
              <p>
                Valorizamos a sua liberdade e flexibilidade. Por isso, o contrato de prestação de serviços do Davi EDU pode ser cancelado a qualquer momento, sem burocracia ou taxas de fidelidade.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <strong>Cancelamento pelo Usuário:</strong> Você pode cancelar sua assinatura a qualquer momento, diretamente pelo painel de configurações da sua escola ou entrando em contato com nosso suporte via WhatsApp.
                </li>
                <li>
                  <strong>Efeitos do Cancelamento:</strong>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>O acesso à plataforma será mantido até o final do ciclo de faturamento já pago.</li>
                    <li>Não haverá reembolso por períodos de assinatura não utilizados.</li>
                    <li>Após o término do ciclo de faturamento, seu acesso será suspenso.</li>
                    <li>Os dados da sua escola serão mantidos por um período de carência de 60 (sessenta) dias, permitindo a reativação da conta ou a exportação dos seus dados. Após este período, os dados serão permanentemente excluídos de nossos servidores. É de sua responsabilidade realizar a exportação de dados antes da exclusão definitiva.</li>
                  </ul>
                </li>
                <li>
                  <strong>Rescisão pelo Davi EDU:</strong> O Davi EDU pode rescindir este contrato e suspender ou encerrar seu acesso à plataforma imediatamente, sem aviso prévio, se você violar qualquer um destes Termos de Uso, realizar atividades ilegais ou prejudiciais à plataforma ou a outros usuários, ou em caso de inadimplência prolongada.
                </li>
              </ul>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">6. Contas de Usuário</h2>
              <p>
                Para utilizar o Davi EDU, você precisará criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Fornecer informações precisas, completas e atualizadas durante o registro.</li>
                <li>Manter a confidencialidade de suas credenciais de login (e-mail e senha).</li>
                <li>Todas as atividades que ocorrem em sua conta, seja por você ou por terceiros autorizados ou não.</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta ou qualquer outra violação de segurança.</li>
              </ul>
              <p>
                O Davi EDU não será responsável por qualquer perda ou dano resultante do seu não cumprimento destas obrigações.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">7. Privacidade e Proteção de Dados</h2>
              <p>
                A sua privacidade e a segurança dos dados da sua escola e dos seus alunos são de extrema importância para nós. Nosso compromisso é proteger todas as informações que você nos confia.
              </p>
              <p>
                Detalhes completos sobre como coletamos, usamos, armazenamos e protegemos seus dados pessoais e os dados de seus alunos estão descritos em nossa <Link to="/privacy" className="text-primary hover:underline font-semibold">Política de Privacidade</Link> separada. Ao aceitar estes Termos de Uso, você também concorda com nossa Política de Privacidade.
              </p>
              <p>
                O Davi EDU está em conformidade com a Lei Geral de Proteção de Dados (LGPD) do Brasil e outras regulamentações de privacidade aplicáveis.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">8. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, design, software, logotipos, marcas registradas e outros elementos da plataforma Davi EDU são de propriedade exclusiva da Imagine IA Soluções e são protegidos por leis de direitos autorais e propriedade intelectual.
              </p>
              <p>
                Você não pode copiar, modificar, distribuir, vender ou alugar qualquer parte de nossos serviços ou software incluído, nem fazer engenharia reversa ou tentar extrair o código-fonte, a menos que tenhamos dado permissão expressa por escrito.
              </p>
              <p>
                O conteúdo e os dados que você insere na plataforma (dados de alunos, notas, documentos da escola, etc.) permanecem de sua propriedade. Você nos concede uma licença limitada para usar, hospedar, armazenar e processar esse conteúdo apenas para fins de fornecimento e melhoria do serviço Davi EDU.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">9. Limitação de Responsabilidade</h2>
              <p>
                O Davi EDU é fornecido "como está" e "conforme disponível", sem garantias de qualquer tipo, expressas ou implícitas. Embora nos esforcemos para manter a plataforma segura, funcional e livre de erros, não garantimos que o serviço será ininterrupto, livre de erros ou que todos os defeitos serão corrigidos.
              </p>
              <p>
                Em nenhuma circunstância o Davi EDU, seus diretores, funcionários, parceiros ou afiliados serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, mas não se limitando a, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes de (i) seu acesso ou uso ou incapacidade de acessar ou usar o serviço; (ii) qualquer conduta ou conteúdo de terceiros no serviço; (iii) qualquer conteúdo obtido do serviço; e (iv) acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo, seja com base em garantia, contrato, delito (incluindo negligência) ou qualquer outra teoria legal, tenhamos ou não sido informados da possibilidade de tais danos.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">10. Modificações nos Termos</h2>
              <p>
                O Davi EDU se reserva o direito de modificar ou substituir estes Termos de Uso a qualquer momento, a nosso exclusivo critério. Se uma revisão for material, faremos esforços razoáveis para fornecer um aviso de pelo menos 30 (trinta) dias antes que quaisquer novos termos entrem em vigor. O que constitui uma alteração material será determinado a nosso exclusivo critério.
              </p>
              <p>
                Ao continuar a acessar ou usar nosso serviço após a entrada em vigor de quaisquer revisões, você concorda em ficar vinculado(a) aos termos revisados. Se você não concordar com os novos termos, por favor, pare de usar o serviço.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">11. Disposições Gerais</h2>
              <p>
                Estes Termos de Uso serão regidos e interpretados de acordo com as leis do Brasil, sem considerar seus conflitos de disposições legais.
              </p>
              <p>
                Qualquer disputa decorrente ou relacionada a estes Termos de Uso será submetida aos tribunais da Comarca de Salvador, Bahia, Brasil.
              </p>
              <p>
                Se qualquer disposição destes Termos for considerada inválida ou inexequível por um tribunal, as demais disposições destes Termos permanecerão em vigor.
              </p>
              <p>
                Estes Termos de Uso constituem o acordo integral entre nós em relação ao nosso Serviço, e substituem e anulam quaisquer acordos anteriores que possamos ter entre nós em relação ao Serviço.
              </p>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">12. Contato</h2>
              <p>
                Se você tiver alguma dúvida sobre estes Termos de Uso, por favor, entre em contato conosco:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <Phone className="inline h-4 w-4 mr-2 text-primary" />
                  WhatsApp: <a href="https://wa.me/5571992059840" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">(71) 99205-9840</a>
                </li>
                <li>
                  <Mail className="inline h-4 w-4 mr-2 text-primary" />
                  Email: <a href="mailto:imagineiasolucoes@gmail.com" className="text-primary hover:underline">imagineiasolucoes@gmail.com</a>
                </li>
                <li>
                  <HelpCircle className="inline h-4 w-4 mr-2 text-primary" />
                  Página de FAQ: <Link to="/faq" className="text-primary hover:underline">Dúvidas Frequentes</Link>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingConsultantButton />
    </div>
  );
};

export default TermsPage;