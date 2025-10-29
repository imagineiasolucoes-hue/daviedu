import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5571992059840";
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre o sistema Davi EDU.";

const WhatsAppButton = () => {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group flex items-center" // Removido 'justify-center' para permitir o slide do texto
    >
      {/* Texto que aparece ao passar o mouse */}
      <div className="absolute top-1/2 -translate-y-1/2
                      right-0 // Alinha a borda direita do texto com a borda direita do container (onde o botão está)
                      opacity-0 group-hover:opacity-100
                      transform translate-x-full // Inicialmente, empurra o texto para a direita por sua própria largura, escondendo-o
                      group-hover:translate-x-[calc(-100%-8px)] // Ao passar o mouse, desliza o texto para a esquerda por sua largura + 8px de espaçamento
                      transition-all duration-300 ease-out
                      text-base font-semibold text-green-800 bg-green-100
                      px-4 py-2 rounded-full shadow-md whitespace-nowrap
                      pointer-events-none"
      >
        Tire suas dúvidas
      </div>
      <Button
        className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center relative z-10"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </a>
  );
};

export default WhatsAppButton;