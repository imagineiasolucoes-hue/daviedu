import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/notifications';

export const useBackupNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && notification.onClose) {
      notification.onClose();
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, [notifications]);

  // Efeito para auto-dismiss de toasts
  useEffect(() => {
    const timers = new Map<string, NodeJS.Timeout>();

    notifications.forEach(notification => {
      if (notification.type === 'toast' && notification.autoDismiss && notification.autoDismiss > 0) {
        if (!timers.has(notification.id)) {
          const timer = setTimeout(() => {
            dismissNotification(notification.id);
          }, notification.autoDismiss * 1000);
          timers.set(notification.id, timer);
        }
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, dismissNotification]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id'>): string => {
    const newNotification = { ...notificationData, id: crypto.randomUUID() };
    setNotifications(prev => [...prev, newNotification]);
    return newNotification.id;
  }, []);

  const showBackupReminder = useCallback((message: string, actions?: Notification['actions']) => {
    return addNotification({
      type: 'toast',
      variant: 'warning',
      title: 'Lembrete de Backup',
      message,
      actions,
      autoDismiss: 10,
    });
  }, [addNotification]);

  // Adjusted signature to accept an object
  const showEmergencyAlert = useCallback((alertProps: { title: string; message: string; actions?: Notification['actions'] }) => {
    return addNotification({
      type: 'modal',
      variant: 'error',
      title: alertProps.title,
      message: alertProps.message,
      actions: alertProps.actions,
      autoDismiss: 0,
    });
  }, [addNotification]);

  const showSuccessFeedback = useCallback((title: string, message: string) => {
    return addNotification({
      type: 'toast',
      variant: 'success',
      title,
      message,
      autoDismiss: 5,
    });
  }, [addNotification]);

  const showProgressNotification = useCallback((title: string, message: string) => {
    return addNotification({
      type: 'toast',
      variant: 'info',
      title,
      message,
      autoDismiss: 0, // Não remove automaticamente
    });
  }, [addNotification]);

  return {
    notifications,
    showBackupReminder,
    showEmergencyAlert,
    showSuccessFeedback,
    showProgressNotification,
    dismissNotification,
  };
};