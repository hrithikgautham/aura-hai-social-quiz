
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [forceRender, setForceRender] = useState(false);
  
  console.log("ProtectedRoute - User:", user, "Loading:", loading);
  
  // Add a timeout to prevent infinite loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading) {
      // If still loading after 3 seconds, force a decision
      timeoutId = setTimeout(() => {
        console.log("Loading timed out in ProtectedRoute, forcing navigation decision");
        setForceRender(true);
      }, 3000); // Reduced from 5s to 3s
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // If we have a user (either from localStorage or authenticated), render content
  // even if technically still loading from Supabase
  if (user) {
    console.log("User found, rendering protected content");
    return <>{children}</>;
  }
  
  // If still loading and timeout hasn't been reached, show loading
  if (loading && !forceRender) {
    return <QuirkyLoading />;
  }

  // If not loading anymore or timeout reached, and we don't have a user, redirect
  console.log("No user found in ProtectedRoute, redirecting to home");
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
