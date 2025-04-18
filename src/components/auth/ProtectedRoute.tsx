
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, authChecked } = useAuth();
  const [forceRender, setForceRender] = useState(false);
  
  console.log("ProtectedRoute - User:", user, "Loading:", loading, "AuthChecked:", authChecked);
  
  useEffect(() => {
    // Set a timeout to prevent long loading screens
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Loading timed out in ProtectedRoute, forcing navigation decision");
        setForceRender(true);
      }
    }, 1000); // Increased for more reliable auth checking
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Don't make any navigation decisions until auth has been checked at least once
  if (!authChecked && !forceRender) {
    return <QuirkyLoading />;
  }

  // If we have a user, render content immediately
  if (user) {
    console.log("User found, rendering protected content");
    return <>{children}</>;
  }
  
  // Show loading only if explicitly loading and timeout not reached
  if (loading && !forceRender) {
    return <QuirkyLoading />;
  }

  // If auth checked and no user, redirect
  console.log("No user found in ProtectedRoute, redirecting to home");
  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
