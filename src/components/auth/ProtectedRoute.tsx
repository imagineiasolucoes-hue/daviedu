import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./SessionContextProvider";
import { Loader2 } from "lucide-react";

const ProtectedRoute: React.FC = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;