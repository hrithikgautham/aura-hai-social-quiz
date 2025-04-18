
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

const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAuthRedirect, setIsAuthRedirect] = useState(false);
  const redirectProcessed = useRef(false);
  const navigationAttempted = useRef(false);
  
  useEffect(() => {
    // Enhanced detection of auth redirects
    if ((location.hash && location.hash.includes('access_token')) && !redirectProcessed.current) {
      console.log("Detected OAuth redirect with hash:", location.hash);
      redirectProcessed.current = true;
      setIsAuthRedirect(true);
      
      // Clean up URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  useEffect(() => {
    if (isAuthRedirect && !navigationAttempted.current) {
      console.log("Auth redirect detected, user:", user, "loading:", loading);
      
      // Reduced timeout from 3s to 2s for faster redirection
      const timeoutId = setTimeout(() => {
        if (!navigationAttempted.current) {
          console.log("Navigation timeout reached, redirecting to dashboard anyway");
          navigationAttempted.current = true;
          navigate('/dashboard', { replace: true });
        }
      }, 2000);
      
      if (!loading && user) {
        console.log("User is authenticated after redirect, navigating to dashboard:", user);
        navigationAttempted.current = true;
        clearTimeout(timeoutId);
        
        navigate('/dashboard', { replace: true });
      }
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, navigate, isAuthRedirect]);
  
  return null;
};

const UnauthorizedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const navigationAttempted = useRef(false);

  useEffect(() => {
    if (!loading && user && !navigationAttempted.current) {
      console.log("User is already logged in, redirecting to dashboard");
      navigationAttempted.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Add a safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading && !navigationAttempted.current) {
        console.log("Loading timed out in UnauthorizedRoute, allowing content to show");
        navigationAttempted.current = true;
      }
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  if (loading && !user && !navigationAttempted.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

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
