import {
  HelpCircle,
  Users,
  UserCheck,
  BookOpen,
  DollarSign,
  Settings,
  FileText,
  Link2Off,
  MessageCircleQuestion,
  Lightbulb,
  CreditCard,
  CalendarDays,
  GraduationCap,
  School,
  Lock,
  ClipboardList,
  Cloud, // Added
  UserPlus, // Added
  Pencil, // Added
  Link, // Added
  TrendingUp, // Added
  TrendingDown, // Added
  BarChart, // Added
  Image, // Added
  Upload, // Added
  Share2, // Added
  QrCode, // Added
  CheckCircle, // Added
} from 'lucide-react';
import { FAQCategory, FAQItem } from '@/types/faq';

export const faqCategories: FAQCategory[] = [
  { key: 'general', title: 'Geral', icon: HelpCircle },
  { key: 'students', title: 'Alunos', icon: Users },
  { key: 'teachers', title: 'Professores', icon: UserCheck },
  { key: 'classes', title: 'Turmas e Cursos', icon: BookOpen },
  { key: 'finance', title: 'Financeiro', icon: DollarSign },
  { key: 'settings', title: 'Configurações', icon: Settings },
  { key: 'documents', title: 'Documentos', icon: FileText },
  { key: 'pre-enrollment', title: 'Pré-Matrícula', icon: Link2Off },
];

export const faqItems: FAQItem[] = [
  // Geral
  {
    id: 'g1',
    category: 'general',
    question: 'O que é o Davi EDU?',
    answer: 'Davi EDU é um sistema de gestão escolar completo, projetado para simplificar as operações de escolas pequenas e médias, cobrindo matrícula, notas, financeiro, comunicação e muito mais.',
    icon: Lightbulb,
  },
  {
    id: 'g2',
    category: 'general',
    question: 'Preciso instalar algum software?',
    answer: 'Não! O Davi EDU é 100% online e baseado em nuvem. Você pode acessá-lo de qualquer lugar, a qualquer momento, usando apenas um navegador de internet.',
    icon: Cloud, // Assuming Cloud icon is available
  },
  {
    id: 'g3',
    category: 'general',
    question: 'Como posso entrar em contato com o suporte?',
    answer: 'Oferecemos suporte rápido e humanizado via WhatsApp. Você pode encontrar o botão "Fale com um consultor" no canto inferior direito da tela ou ir para a página de contato.',
    icon: MessageCircleQuestion,
  },
  {
    id: 'g4',
    category: 'general',
    question: 'O sistema é seguro?',
    answer: 'Sim, a segurança dos seus dados é nossa prioridade. Utilizamos as melhores práticas de segurança e infraestrutura de nuvem robusta para proteger todas as informações da sua escola.',
    icon: Lock,
  },

  // Alunos
  {
    id: 's1',
    category: 'students',
    question: 'Como cadastrar um novo aluno?',
    answer: 'No painel, vá para a seção "Alunos" e clique no botão "Novo Aluno". Preencha o formulário com os dados do estudante e do responsável.',
    icon: UserPlus, // Assuming UserPlus icon is available
  },
  {
    id: 's2',
    category: 'students',
    question: 'Posso editar os dados de um aluno já cadastrado?',
    answer: 'Sim. Na lista de alunos, clique no ícone de três pontos ao lado do nome do aluno e selecione "Editar".',
    icon: Pencil, // Assuming Pencil icon is available
  },
  {
    id: 's3',
    category: 'students',
    question: 'Como vincular um aluno a uma turma?',
    answer: 'Ao cadastrar ou editar um aluno, você pode selecionar a turma desejada no campo "Turma". Certifique-se de que a turma já foi criada.',
    icon: Link, // Assuming Link icon is available
  },

  // Professores
  {
    id: 't1',
    category: 'teachers',
    question: 'Como adicionar um novo professor?',
    answer: 'Acesse a seção "Professores" no menu lateral e clique em "Novo Professor". Preencha os dados profissionais e as turmas que ele irá lecionar.',
    icon: UserPlus,
  },
  {
    id: 't2',
    category: 'teachers',
    question: 'É possível atribuir várias turmas a um professor?',
    answer: 'Sim, no formulário de cadastro ou edição do professor, você pode adicionar múltiplas turmas e períodos para cada um.',
    icon: ClipboardList,
  },

  // Turmas e Cursos
  {
    id: 'c1',
    category: 'classes',
    question: 'Como criar um novo curso ou série?',
    answer: 'Vá para "Turmas" no menu lateral, depois clique em "Cursos/Séries" e use o botão "Novo Curso/Série" para adicionar. Ex: "1º Ano Fundamental", "Ensino Médio".',
    icon: BookOpen,
  },
  {
    id: 'c2',
    category: 'classes',
    question: 'Como criar uma nova turma?',
    answer: 'Na seção "Turmas", clique em "Nova Turma". Você precisará vincular a turma a um curso/série existente e definir o ano letivo e período.',
    icon: School,
  },

  // Financeiro
  {
    id: 'f1',
    category: 'finance',
    question: 'Como registrar uma receita?',
    answer: 'No menu "Financeiro", selecione "Receitas" e clique em "Nova Receita". Informe o valor, data, categoria e método de pagamento.',
    icon: TrendingUp, // Assuming TrendingUp icon is available
  },
  {
    id: 'f2',
    category: 'finance',
    question: 'Como registrar uma despesa?',
    answer: 'No menu "Financeiro", selecione "Despesas" e clique em "Nova Despesa". Preencha os detalhes como valor, data, categoria e fornecedor.',
    icon: TrendingDown, // Assuming TrendingDown icon is available
  },
  {
    id: 'f3',
    category: 'finance',
    question: 'Posso ver um resumo financeiro mensal?',
    answer: 'Sim, a página "Financeiro" oferece gráficos e métricas que mostram o fluxo de caixa e a distribuição de despesas do mês e do ano.',
    icon: BarChart, // Assuming BarChart icon is available
  },
  {
    id: 'f4',
    category: 'finance',
    question: 'Como gerenciar categorias de receitas e despesas?',
    answer: 'As categorias são gerenciadas nas configurações financeiras. Você pode criar, editar ou excluir categorias para organizar melhor seu fluxo de caixa.',
    icon: ListChecks,
  },

  // Configurações
  {
    id: 'set1',
    category: 'settings',
    question: 'Como alterar o nome da minha escola?',
    answer: 'Vá para "Configurações" no menu lateral, selecione a aba "Escola" e edite o campo "Nome da Escola".',
    icon: School,
  },
  {
    id: 'set2',
    category: 'settings',
    question: 'Posso fazer upload da logo da minha escola?',
    answer: 'Sim, na aba "Escola" das "Configurações", você encontrará uma seção para fazer upload da logo da sua instituição.',
    icon: Image, // Assuming Image icon is available
  },
  {
    id: 'set3',
    category: 'settings',
    question: 'Como alterar minha senha?',
    answer: 'Na página "Configurações", vá para a aba "Segurança" e siga as instruções para definir uma nova senha.',
    icon: Lock,
  },

  // Documentos
  {
    id: 'd1',
    category: 'documents',
    question: 'Onde posso fazer upload de documentos?',
    answer: 'A seção "Documentos" é o local central para gerenciar arquivos da escola e dos alunos. Você pode fazer upload e organizar seus documentos lá.',
    icon: Upload, // Assuming Upload icon is available
  },
  {
    id: 'd2',
    category: 'documents',
    question: 'Quais tipos de documentos posso armazenar?',
    answer: 'Você pode armazenar diversos tipos de documentos, como históricos escolares, comprovantes, formulários de matrícula, políticas da escola, etc.',
    icon: FileText,
  },

  // Pré-Matrícula
  {
    id: 'p1',
    category: 'pre-enrollment',
    question: 'Como funciona o link de pré-matrícula?',
    answer: 'Cada escola possui um link exclusivo de pré-matrícula. Você pode copiá-lo do seu Dashboard e compartilhá-lo com os pais para que preencham os dados iniciais dos alunos.',
    icon: Share2, // Assuming Share2 icon is available
  },
  {
    id: 'p2',
    category: 'pre-enrollment',
    question: 'Onde encontro o QR Code da pré-matrícula?',
    answer: 'O QR Code para o link de pré-matrícula está disponível na aba "Escola" das "Configurações". Você pode baixá-lo e usar em materiais impressos.',
    icon: QrCode, // Assuming QrCode icon is available
  },
  {
    id: 'p3',
    category: 'pre-enrollment',
    question: 'O que acontece após o envio da pré-matrícula?',
    answer: 'Após o envio, os dados do aluno ficam registrados no sistema com o status "Pré-Matriculado". A secretaria da escola pode então revisar e ativar a matrícula.',
    icon: CheckCircle,
  },
];