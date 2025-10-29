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
      className="fixed bottom-24 right-6 z-50 group flex items-center space-x-2" // Alterado de bottom-6 para bottom-24
    >
      {/* Texto que aparece ao passar o mouse */}
      <div className="
                      max-w-0 overflow-hidden // Inicialmente oculto e sem largura
                      group-hover:max-w-40 group-hover:px-4 // Expande a largura e adiciona padding no hover
                      transition-all duration-300 ease-out
                      text-base font-semibold text-green-800 bg-green-100
                      py-2 rounded-full shadow-md whitespace-nowrap
                      "
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