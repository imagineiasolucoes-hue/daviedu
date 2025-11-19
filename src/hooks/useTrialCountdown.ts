import { useState, useEffect, useMemo } from 'react';
import { differenceInSeconds, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProfile } from './useProfile';

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isTrialing: boolean;
  expiresAt: string | null;
  timeRemainingString: string;
}

const useTrialCountdown = (): Countdown => {
  const { profile } = useProfile();
  
  // A data de expiração real do tenant
  const trialExpiresAt = profile?.tenant_status === 'trial' ? profile.trial_expires_at : null;

  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!trialExpiresAt) {
      setTimeRemaining(0);
      return;
    }

    const calculateTime = () => {
      const expirationDate = parseISO(trialExpiresAt);
      const seconds = differenceInSeconds(expirationDate, new Date());
      setTimeRemaining(Math.max(0, seconds));
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [trialExpiresAt]);

  const countdown = useMemo(() => {
    const isTrialing = profile?.tenant_status === 'trial';
    
    if (!isTrialing) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, isTrialing: false, expiresAt: null, timeRemainingString: '' };
    }

    if (timeRemaining <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isTrialing: true, expiresAt: trialExpiresAt, timeRemainingString: 'Expirado' };
    }

    const totalSeconds = timeRemaining;
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const timeRemainingString = formatDistanceToNowStrict(parseISO(trialExpiresAt!), {
        locale: ptBR,
        addSuffix: true,
    });

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      isTrialing: true,
      expiresAt: trialExpiresAt,
      timeRemainingString,
    };
  }, [timeRemaining, trialExpiresAt, profile?.tenant_status]);

  return countdown;
};

export default useTrialCountdown;