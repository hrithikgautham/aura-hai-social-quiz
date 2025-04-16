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
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";
import AuthCallback from "./components/auth/AuthCallback";

// Handle auth redirects from OAuth providers
const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the URL contains an access_token (OAuth redirect)
    if (location.hash && location.hash.includes('access_token')) {
      console.log("Detected OAuth redirect - handling authentication");
      
      // Wait briefly for the auth state to be processed by Supabase
      setTimeout(() => {
        // Replace the current URL to remove the hash
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/dashboard', { replace: true });
      }, 800); // Increased timeout for more reliability
    }
  }, [location, navigate]);
  
  return null;
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
            <Route path="/" element={<Index />} />
            <Route path="/auth/v1/callback" element={<AuthCallback />} />
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
