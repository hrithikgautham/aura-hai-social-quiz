
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import { useEffect, useRef } from "react";

const AuthRedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, authChecked } = useAuth();
  const hasProcessedRedirect = useRef(false);
  
  // Handle saved redirects when user is authenticated
  useEffect(() => {
    if (user && authChecked && !loading && !hasProcessedRedirect.current) {
      const savedRedirect = localStorage.getItem('auth_redirect_path');
      
      if (savedRedirect) {
        console.log("User authenticated, redirecting to saved path:", savedRedirect);
        localStorage.removeItem('auth_redirect_path'); // Clean up
        hasProcessedRedirect.current = true;
        navigate(savedRedirect, { replace: true });
      }
    }
  }, [user, loading, authChecked, navigate]);
  
  // Handle OAuth redirects (from hash fragments)
  useEffect(() => {
    const hasAuthParams = 
      (location.hash && 
       (location.hash.includes('access_token') || 
        location.hash.includes('error') || 
        location.hash.includes('provider')
       )
      );
      
    if (hasAuthParams && !hasProcessedRedirect.current) {
      console.log("Detected OAuth redirect with hash:", location.hash);
      hasProcessedRedirect.current = true;
      
      // Clean URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);
  
  // This component doesn't render anything
  return null;
};

const UnauthorizedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, authChecked } = useAuth();
  const navigate = useNavigate();
  const navigationAttempted = useRef(false);

  useEffect(() => {
    if (authChecked && !loading && user && !navigationAttempted.current) {
      console.log("User is already logged in, redirecting to dashboard");
      navigationAttempted.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, authChecked, navigate]);

  // Allow content to be shown if auth has been checked and user is not logged in
  if (!loading && authChecked && !user) {
    return <>{children}</>;
  }
  
  // While checking auth status, show loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
};

const FloatingMenuWrapper = () => {
  const { user } = useAuth();
  return user ? <FloatingMenu /> : null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
