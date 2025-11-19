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

  const isCritical = days < 1;
  const bgColor = isExpired ? 'bg-destructive/10 border-destructive' : (isCritical ? 'bg-yellow-500/10 border-yellow-500' : 'bg-primary/10 border-primary');
  const textColor = isExpired ? 'text-destructive' : (isCritical ? 'text-yellow-600 dark:text-yellow-400' : 'text-primary dark:text-primary');
  const Icon = isExpired ? AlertTriangle : Clock;

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
            {isExpired ? (
              <p className="font-bold text-destructive">PERÍODO DE TESTE EXPIRADO!</p>
            ) : (
              <p className="font-semibold">
                Seu teste grátis expira em:
              </p>
            )}
            <p className="text-xs text-muted-foreground">
                {isExpired ? 'Seu acesso será suspenso em breve. Regularize sua situação.' : `Tempo restante: ${timeRemainingString}`}
            </p>
          </div>
        </div>

        {isExpired ? (
            <Button asChild variant="destructive" className="w-full md:w-auto">
                <a href="https://pay.kiwify.com.br/r3Ur8To" target="_blank" rel="noopener noreferrer">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Regularizar Agora
                </a>
            </Button>
        ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {countdownDisplay}
                <Button asChild className="w-full sm:w-auto bg-kiwify hover:bg-kiwify/90 text-white">
                    <a href="https://pay.kiwify.com.br/r3Ur8To" target="_blank" rel="noopener noreferrer">
                        Assinar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialCountdownBanner;