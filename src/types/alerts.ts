export type AlertType = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  timestamp: Date;
  autoDismiss?: number; // segundos
}