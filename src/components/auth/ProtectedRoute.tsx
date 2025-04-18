
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
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (loading) {
      // Even shorter timeout (500ms) for faster decision
      timeoutId = setTimeout(() => {
        console.log("Loading timed out in ProtectedRoute, forcing navigation decision");
        setForceRender(true);
      }, 500); // Reduced from 800ms to 500ms for faster response
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // If we have a user, render content immediately
  if (user) {
    console.log("User found, rendering protected content");
    return <>{children}</>;
  }
  
  // Show loading only very briefly
  if (loading && !forceRender) {
    return <QuirkyLoading />;
  }

  // If not loading or timeout reached, and no user, redirect
  console.log("No user found in ProtectedRoute, redirecting to home");
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
