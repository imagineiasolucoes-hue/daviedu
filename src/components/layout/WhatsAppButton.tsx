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
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        className="rounded-full h-14 px-6 bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center"
      >
        <MessageCircle className="h-6 w-6 mr-2" />
        <span className="text-base font-semibold">Tire suas dúvidas</span>
      </Button>
    </a>
  );
};

export default WhatsAppButton;