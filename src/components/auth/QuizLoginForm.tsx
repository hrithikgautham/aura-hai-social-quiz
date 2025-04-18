
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';

export const QuizLoginForm = ({ quizCreator, quizId }: { quizCreator?: string, quizId?: string }) => {
  const { loginWithGoogle, signInWithIdToken } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oneTapInitialized, setOneTapInitialized] = useState(false);

  // Google One Tap setup with better error handling
  useEffect(() => {
    // Only initialize Google One Tap when not already in a login process
    if (isLoggingIn || oneTapInitialized) return;
    
    // Load the Google Identity Services script
    const loadGoogleScript = () => {
      if (document.getElementById('google-identity-script')) {
        initializeOneTap();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-identity-script';
      script.async = true;
      script.defer = true;
      script.onerror = () => console.error("Failed to load Google Identity script");
      script.onload = initializeOneTap;
      document.body.appendChild(script);
    };

    const initializeOneTap = () => {
      if (!window.google) {
        console.error("Google Identity API not available");
        return;
      }

      if (!document.getElementById('google-one-tap-container')) {
        // Create container for One Tap
        const containerDiv = document.createElement('div');
        containerDiv.id = 'google-one-tap-container';
        document.body.appendChild(containerDiv);
        
        try {
          window.google.accounts.id.initialize({
            client_id: '539258633496-l6fi7nsu457imj74156b9g7tu4d4iro1.apps.googleusercontent.com',
            callback: handleGoogleOneTapResponse,
            auto_select: true,
            cancel_on_tap_outside: false
          });
          
          window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.log('One Tap not displayed:', notification.getNotDisplayedReason() || notification.getSkippedReason());
            }
          });
          
          setOneTapInitialized(true);
        } catch (error) {
          console.error("Error initializing Google One Tap:", error);
        }
      }
    };
    
    // Short timeout before loading to avoid interfering with page load
    setTimeout(loadGoogleScript, 500);
    
    return () => {
      // Clean up
      const container = document.getElementById('google-one-tap-container');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, [isLoggingIn, oneTapInitialized]);

  // Handle Google One Tap response
  const handleGoogleOneTapResponse = async (response: any) => {
    if (response.credential) {
      setIsLoggingIn(true);
      setAuthError(null);
      
      try {
        // For quiz takers, try to login if account exists or create a new account
        const result = await signInWithIdToken(response.credential);

        if (!result.success) {
          setAuthError(result.error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: result.error,
          });
          setIsLoggingIn(false);
        } else {
          toast({
            title: "Login successful!",
            description: "Welcome to Aura Hai!",
          });
          
          // Don't reload - just allow the component to re-render
          // This gives a smoother experience
          setIsLoggingIn(false);
          
          // If we have a quizId, reload the page to start the quiz
          if (quizId) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Google One Tap auth error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not log in with Google. Please try again.",
        });
        setIsLoggingIn(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    
    try {
      setIsLoggingIn(true);
      setAuthError(null);
      
      console.log("Initiating Google login");
      
      const productionDomain = window.location.origin;
      
      // If we're on a quiz page, redirect back to the same quiz after login
      let redirectPath = '/dashboard';
      if (quizId) {
        redirectPath = `/quiz/${quizId}`;
      } else if (location.pathname.includes('/quiz/')) {
        const pathQuizId = location.pathname.split('/quiz/')[1].split('/')[0];
        if (pathQuizId) {
          redirectPath = `/quiz/${pathQuizId}`;
        }
      }
      
      await loginWithGoogle(false, productionDomain, redirectPath);
      
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
        {isLoggingIn ? "Connecting..." : "Login with Google"}
      </Button>
    </form>
  );
};
