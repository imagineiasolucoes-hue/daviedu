import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./SessionContextProvider";

const ProtectedRoute: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // Loading state handled by SessionContextProvider
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;