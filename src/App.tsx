
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import PageLayout from "./components/layout/PageLayout";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./integrations/supabase/client";

// Handle auth redirects from OAuth providers
const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAuthRedirect, setIsAuthRedirect] = useState(false);
  const redirectProcessed = useRef(false);
  
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
    const checkUserAndNavigate = async () => {
      if (!loading) {
        if (user) {
          console.log("User is authenticated, navigating to dashboard:", user);
          // Add a small delay to ensure the auth state is fully processed
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000); // Increased delay for extra safety
        } else if (isAuthRedirect) {
          console.log("Auth redirect processed but no user found, staying on current page");
        }
      }
    };
    
    checkUserAndNavigate();
  }, [user, loading, navigate, isAuthRedirect]);
  
  return null;
};

// New component for unauthorized routes
const UnauthorizedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      console.log("User is already logged in, redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return <>{children}</>;
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
        <Sonner />
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
                <PageLayout>
                  <Dashboard />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/quiz/create" element={
              <ProtectedRoute>
                <PageLayout isQuizCreate>
                  <QuizCreate />
                </PageLayout>
              </ProtectedRoute>
            } />
            <Route path="/quiz/:quizId" element={<QuizTake />} />
            <Route path="/quiz/:quizId/analytics" element={
              <ProtectedRoute>
                <PageLayout>
                  <QuizAnalytics />
                </PageLayout>
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
