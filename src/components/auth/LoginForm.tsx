
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

  // Google One Tap setup
  useEffect(() => {
    // Only initialize Google One Tap on the login/signup page
    // and not when the user is already in a login process
    if (isLoggingIn) return;
    
    // Load the Google Identity Services script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      script.onload = initializeOneTap;
    };

    const initializeOneTap = () => {
      if (window.google && !document.getElementById('google-one-tap-container')) {
        // Create container for One Tap
        const containerDiv = document.createElement('div');
        containerDiv.id = 'google-one-tap-container';
        document.body.appendChild(containerDiv);
        
        window.google.accounts.id.initialize({
          client_id: '539258633496-l6fi7nsu457imj74156b9g7tu4d4iro1.apps.googleusercontent.com', // This should be your Google OAuth client ID
          callback: handleGoogleOneTapResponse,
          auto_select: true,
          cancel_on_tap_outside: false
        });
        
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason() || notification.getSkippedReason());
          }
        });
      }
    };
    
    loadGoogleScript();
    
    return () => {
      // Clean up
      const container = document.getElementById('google-one-tap-container');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, [isLoggingIn]);

  // Handle Google One Tap response
  const handleGoogleOneTapResponse = async (response: any) => {
    if (response.credential) {
      setIsLoggingIn(true);
      
      try {
        // Authenticate with Supabase using the ID token
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error("Google One Tap error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log in with Google. Please try again.",
          });
        } else {
          toast({
            title: "Login successful!",
            description: "Welcome to Aura Hai!",
          });
        }
      } catch (error) {
        console.error("Google One Tap auth error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not log in with Google. Please try again.",
        });
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

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
      
      const appUrl = window.location.origin;
      const redirectURL = `${appUrl}/auth/v1/callback`;
      
      console.log("Initiating Google login with redirect to:", redirectURL);
      
      await loginWithGoogle(redirectURL);
      
      toast({
        title: "Logging you in...",
        description: "Please wait while we connect to Google.",
      });
      
      // We don't reset isLoggingIn because we're navigating away from this page
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log in with Google. Please try again.",
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
