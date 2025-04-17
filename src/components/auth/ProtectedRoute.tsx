
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import QuirkyLoading from '@/components/layout/QuirkyLoading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  console.log("ProtectedRoute - User:", user, "Loading:", loading);

  if (loading) {
    return <QuirkyLoading />;
  }

  if (!user) {
    console.log("No user found in ProtectedRoute, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
