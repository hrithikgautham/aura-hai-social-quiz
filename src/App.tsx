
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import QuizCreate from "./pages/QuizCreate";
import QuizTake from "./pages/QuizTake";
import QuizAnalytics from "./pages/QuizAnalytics";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import ProfileEdit from "./pages/ProfileEdit";
import { FloatingMenu } from "./components/layout/FloatingMenu";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

// Handle auth redirects from OAuth providers
const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAuthRedirect, setIsAuthRedirect] = useState(false);
  const redirectProcessed = useRef(false);
  const navigationAttempted = useRef(false);
  
  useEffect(() => {
    // Check if the URL contains an access_token (OAuth redirect)
    if ((location.hash && location.hash.includes('access_token')) && !redirectProcessed.current) {
      console.log("Detected OAuth redirect with hash:", location.hash);
      redirectProcessed.current = true;
      setIsAuthRedirect(true);
      
      // Let the hash be processed by supabase client's detectSessionInUrl
      // then clear it to prevent confusion on page reloads
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }
  }, [location]);

  // Add a second effect to handle navigation once user is loaded
  useEffect(() => {
    // Only attempt navigation once to prevent infinite redirects
    if (isAuthRedirect && !navigationAttempted.current) {
      console.log("Auth redirect detected, user:", user, "loading:", loading);
      
      // Set a timeout to prevent being stuck if auth never completes
      const timeoutId = setTimeout(() => {
        if (!navigationAttempted.current) {
          console.log("Navigation timeout reached, redirecting to dashboard anyway");
          navigationAttempted.current = true;
          navigate('/dashboard', { replace: true });
        }
      }, 5000);
      
      // If user is available, navigate immediately
      if (!loading && user) {
        console.log("User is authenticated after redirect, navigating to dashboard:", user);
        navigationAttempted.current = true;
        clearTimeout(timeoutId);
        
        // Navigate to dashboard with replace to prevent back button issues
        navigate('/dashboard', { replace: true });
      }
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, navigate, isAuthRedirect]);
  
  return null;
};

// New component for unauthorized routes
const UnauthorizedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const navigationAttempted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!loading && user && !navigationAttempted.current) {
      console.log("User is already logged in, redirecting to dashboard");
      navigationAttempted.current = true;
      navigate('/dashboard', { replace: true });
    }
    
    // Set a timeout to prevent infinite loading
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        console.log("UnauthorizedRoute loading timeout reached");
        // Just force a re-render without changing loading state
      }, 5000);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user, loading, navigate]);

  // If we have a user but we're still loading, just render content
  if (loading && user) {
    console.log("UnauthorizedRoute - User available but still loading, rendering dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // Only render children if user is not authenticated
  return !user ? <>{children}</> : null;
};

const FloatingMenuWrapper = () => {
  const { user } = useAuth();
  return user ? <FloatingMenu /> : null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthRedirectHandler />
          <FloatingMenuWrapper />
          <Routes>
            <Route path="/" element={
              <UnauthorizedRoute>
                <Index />
              </UnauthorizedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/quiz/create" element={
              <ProtectedRoute>
                <QuizCreate />
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId" element={<QuizTake />} />
            <Route path="/quiz/:quizId/analytics" element={
              <ProtectedRoute>
                <QuizAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
