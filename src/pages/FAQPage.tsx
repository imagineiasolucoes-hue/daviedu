import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HelpCircle, Search, ArrowLeft, MessageCircleQuestion } from 'lucide-react'; // Added MessageCircleQuestion
import { faqCategories, faqItems } from '@/data/faqData';
import FAQCategoryCard from '@/components/faq/FAQCategoryCard';
import { FAQCategoryKey } from '@/types/faq';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<FAQCategoryKey | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredFaqs = useMemo(() => {
    let currentFaqs = faqItems;

    if (activeCategory) {
      currentFaqs = currentFaqs.filter(faq => faq.category === activeCategory);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentFaqs = currentFaqs.filter(
        faq =>
          faq.question.toLowerCase().includes(lowerCaseSearchTerm) ||
          faq.answer.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return currentFaqs;
  }, [activeCategory, searchTerm]);

  const handleCategoryClick = (categoryKey: FAQCategoryKey) => {
    setActiveCategory(prev => (prev === categoryKey ? null : categoryKey));
    setSearchTerm(''); // Limpa a busca ao selecionar uma categoria
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" asChild>
            <Link to="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <HelpCircle className="h-8 w-8 text-primary" />
            Dúvidas Frequentes
          </h1>
        </div>

        {/* Barra de Busca */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por pergunta ou palavra-chave..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-input focus-visible:ring-ring focus-visible:ring-2"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveCategory(null); // Limpa a categoria ao buscar
            }}
          />
        </div>

        <Separator />

        {/* Mapa de Categorias (Dynamic Map) */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Explore por Categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {faqCategories.map(category => (
              <FAQCategoryCard
                key={category.key}
                category={category}
                isActive={activeCategory === category.key}
                onClick={handleCategoryClick}
              />
            ))}
          </div>
          {activeCategory && (
            <div className="text-center text-sm text-muted-foreground mt-4">
              Exibindo perguntas para: <span className="font-semibold text-primary">{faqCategories.find(c => c.key === activeCategory)?.title}</span>
              <Button variant="link" onClick={() => setActiveCategory(null)} className="ml-2 p-0 h-auto text-sm">
                (Ver todas)
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Lista de FAQs */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">
            {activeCategory ? `Perguntas sobre ${faqCategories.find(c => c.key === activeCategory)?.title}` : 'Todas as Perguntas'}
            {searchTerm && ` (Resultados para "${searchTerm}")`}
          </h2>
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map(faq => {
                const Icon = faq.icon || MessageCircleQuestion; // Ícone padrão
                return (
                  <Card key={faq.id} className="mb-4">
                    <AccordionItem value={faq.id}>
                      <AccordionTrigger className="flex items-center gap-3 px-4 py-3 text-left hover:no-underline">
                        <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium text-lg">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                );
              })}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma pergunta encontrada para os critérios selecionados.
            </p>
          )}
        </div>

        {/* Seção de Feedback (Exemplo) */}
        <Separator />
        <div className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-semibold">Não encontrou o que procurava?</h2>
          <p className="text-muted-foreground">
            Entre em contato com nosso suporte ou sugira uma nova pergunta.
          </p>
          <Button asChild className="bg-accent hover:bg-accent/90">
            <a href="https://wa.me/5571992059840" target="_blank" rel="noopener noreferrer">
              <MessageCircleQuestion className="mr-2 h-4 w-4" />
              Fale com o Suporte
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;