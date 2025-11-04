import React from 'react';
import { Navigate } from 'react-router-dom';

// Esta página foi removida conforme a solicitação de simplificação do painel Super Admin.
const KiwifyPage: React.FC = () => {
  return <Navigate to="/dashboard" replace />;
};

export default KiwifyPage;