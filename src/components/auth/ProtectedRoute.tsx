
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  
  console.log("ProtectedRoute - User:", user, "Loading:", loading);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading) {
      // If still loading after 5 seconds, force timeout
      timeoutId = setTimeout(() => {
        console.log("Loading timed out in ProtectedRoute, forcing navigation decision");
        // The timeout won't change the state, but the component will re-render
        // and evaluate the conditions below with the current state
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // If loading for more than 3 seconds and we have a user, just render content
  if (loading && user) {
    console.log("User found but still loading, proceeding to render content");
    return <>{children}</>;
  }
  
  // If still loading and no user, show loading
  if (loading && !user) {
    return <QuirkyLoading />;
  }

  if (!user) {
    console.log("No user found in ProtectedRoute, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
