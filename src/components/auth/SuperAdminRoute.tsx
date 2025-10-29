import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./SessionContextProvider";
import { Loader2 } from "lucide-react";

const SuperAdminRoute: React.FC = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== "super_admin") {
    // Redirect them to the home page if they are not a super admin.
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;