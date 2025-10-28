import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999"; // Use o mesmo número do cadastro
const WHATSAPP_MESSAGE = "Olá! Gostaria de saber mais sobre o sistema Davi EDU.";

const WhatsAppButton = () => {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="icon"
        className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white shadow-lg"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="sr-only">Fale conosco pelo WhatsApp</span>
      </Button>
    </a>
  );
};

export default WhatsAppButton;