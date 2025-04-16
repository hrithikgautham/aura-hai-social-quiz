import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
          <FloatingMenuWrapper />
          <Routes>
            <Route path="/" element={<Index />} />
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
