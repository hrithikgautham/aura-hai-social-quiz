
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from 'react-router-dom';

interface LoginFormProps {
  isSignup?: boolean;
}

export const LoginForm = ({ isSignup = false }: LoginFormProps) => {
  const [quizCreator, setQuizCreator] = useState<string | null>(null);
  const { loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname.includes('/quiz/')) {
      const fetchQuizCreator = async () => {
        const quizId = location.pathname.split('/quiz/')[1];
        if (!quizId) return;
        
        try {
          const { data, error } = await supabase
            .from('quizzes')
            .select('creator_id, users:creator_id(username)')
            .eq('shareable_link', quizId)
            .single();

          if (error || !data) {
            console.error('Error fetching quiz creator:', error);
            return;
          }

          if (data.users?.username) {
            setQuizCreator(data.users.username);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      };

      fetchQuizCreator();
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      
      console.log(`Initiating Google ${isSignup ? 'signup' : 'login'} for production`);
      
      // Use explicit production domain for redirection to solve the issue
      const productionDomain = 'https://aura-hai-social-quiz.lovable.app';
      await loginWithGoogle(isSignup, productionDomain);
      
      toast({
        title: isSignup ? "Signing you up..." : "Logging you in...",
        description: "Please wait while we connect to Google.",
      });
      
      // We don't reset isLoggingIn because we're navigating away from this page
    } catch (error) {
      console.error("Google authentication error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not ${isSignup ? 'sign up' : 'log in'} with Google. Please try again.`,
      });
      setIsLoggingIn(false);
    }
  };

  return (
    <form className="space-y-6 w-full max-w-sm">
      {quizCreator && (
        <div className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] p-4 rounded-lg text-white mb-4">
          <h3 className="font-bold text-lg mb-1">You're taking a quiz created by:</h3>
          <p className="text-xl font-bold">{quizCreator}</p>
        </div>
      )}

      {authError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{authError}</span>
        </div>
      )}
      
      <Button 
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoggingIn}
        className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isLoggingIn ? "Connecting..." : (isSignup ? "Sign up with Google" : "Login with Google")}
      </Button>
    </form>
  );
};
