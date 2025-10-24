import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/auth/SessionContextProvider";

const Index = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null; // Wait for auth state to load
  }

  // Redirect authenticated users to the dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users to the login page
  return <Navigate to="/login" replace />;
};

export default Index;