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
      className="fixed bottom-6 right-6 z-50 group flex items-center justify-center"
    >
      <Button
        className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center relative z-10"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      {/* Texto que aparece ao passar o mouse */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                      opacity-0 group-hover:opacity-100
                      transform translate-y-2 group-hover:translate-y-0
                      scale-90 group-hover:scale-100
                      rotate-0 group-hover:rotate-3
                      transition-all duration-300 ease-out
                      text-base font-semibold text-green-800 bg-green-100
                      px-4 py-2 rounded-full shadow-md whitespace-nowrap
                      pointer-events-none"
      >
        Tire suas dúvidas
      </div>
    </a>
  );
};

export default WhatsAppButton;