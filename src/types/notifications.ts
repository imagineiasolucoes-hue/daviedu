export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: 'toast' | 'modal' | 'banner';
  variant: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actions?: NotificationAction[];
  autoDismiss?: number; // in seconds
  onClose?: () => void;
}