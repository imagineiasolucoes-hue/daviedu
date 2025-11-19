import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import useTrialCountdown from '@/hooks/useTrialCountdown';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const formatTime = (value: number) => String(value).padStart(2, '0');

const TrialCountdownBanner: React.FC = () => {
  const { days, hours, minutes, seconds, isExpired, isTrialing, timeRemainingString } = useTrialCountdown();

  // Se não estiver em período de teste, não exibe nada
  if (!isTrialing) {
    return null;
  }

  // isCritical é true quando faltam menos de 24 horas (days < 1)
  const isCritical = days < 1;
  
  // Define cores e ícones
  let bgColor = 'bg-primary/10 border-primary';
  let textColor = 'text-primary dark:text-primary';
  let Icon = Clock;
  let message = `Seu teste grátis expira em:`;
  let subMessage = `Tempo restante: ${timeRemainingString}`;
  let actionButton;

  if (isExpired) {
    // Estado 1: Expirado (timeRemaining <= 0)
    bgColor = 'bg-destructive/10 border-destructive';
    textColor = 'text-destructive';
    Icon = AlertTriangle;
    message = 'PERÍODO DE TESTE EXPIRADO!';
    subMessage = 'Seu acesso será suspenso em breve. Regularize sua situação.';
    actionButton = (
      <Button asChild variant="destructive" className="w-full md:w-auto">
        <a href="https://pay.kiwify.com.br/2TGijY8" target="_blank" rel="noopener noreferrer">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Regularizar Agora
        </a>
      </Button>
    );
  } else if (isCritical) {
    // Estado 2: Último dia (days < 1, mas não expirado)
    bgColor = 'bg-yellow-500/10 border-yellow-500';
    textColor = 'text-yellow-600 dark:text-yellow-400';
    Icon = AlertTriangle;
    message = 'ATENÇÃO: Seu teste grátis expira HOJE!';
    subMessage = `Tempo restante: ${timeRemainingString}. Não perca seu acesso.`;
    actionButton = (
      <Button asChild className="w-full sm:w-auto bg-kiwify hover:bg-kiwify/90 text-white">
        <a href="https://pay.kiwify.com.br/2TGijY8" target="_blank" rel="noopener noreferrer">
          Assinar Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    );
  } else {
    // Estado 3: Contagem normal (days >= 1)
    actionButton = (
      <Button asChild className="w-full sm:w-auto bg-kiwify hover:bg-kiwify/90 text-white">
        <a href="https://pay.kiwify.com.br/2TGijY8" target="_blank" rel="noopener noreferrer">
          Assinar Agora
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    );
  }

  const countdownDisplay = (
    <div className="flex items-center space-x-4 font-mono text-lg font-bold">
      <div className="text-center">
        <span className={cn("block text-2xl", textColor)}>{formatTime(days)}</span>
        <span className="text-xs text-muted-foreground">DIAS</span>
      </div>
      <span className={textColor}>:</span>
      <div className="text-center">
        <span className={cn("block text-2xl", textColor)}>{formatTime(hours)}</span>
        <span className="text-xs text-muted-foreground">HRS</span>
      </div>
      <span className={textColor}>:</span>
      <div className="text-center">
        <span className={cn("block text-2xl", textColor)}>{formatTime(minutes)}</span>
        <span className="text-xs text-muted-foreground">MIN</span>
      </div>
      <span className={textColor}>:</span>
      <div className="text-center">
        <span className={cn("block text-2xl", textColor)}>{formatTime(seconds)}</span>
        <span className="text-xs text-muted-foreground">SEG</span>
      </div>
    </div>
  );

  return (
    <Card className={cn("w-full shadow-md transition-all duration-300", bgColor)}>
      <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-6 w-6 flex-shrink-0", textColor)} />
          <div className="text-sm">
            <p className={cn("font-bold", textColor)}>{message}</p>
            <p className="text-xs text-muted-foreground">
                {subMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {countdownDisplay}
            {actionButton}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialCountdownBanner;