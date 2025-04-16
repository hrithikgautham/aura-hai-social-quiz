
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const { checkIfUserExists } = useAuth();

  // Process the authentication on component mount
  useEffect(() => {
    const processAuth = async () => {
      // Get the sign up flag from URL params (if it exists)
      const signupParam = searchParams.get('signup');
      const isSignupFlow = signupParam === 'true';
      
      // The hash contains tokens from the OAuth provider
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const errorDescription = hashParams.get('error_description');
      
      // Clear the hash to avoid tokens being exposed in browser history
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      
      if (errorDescription) {
        setError(errorDescription);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: errorDescription,
        });
        return;
      }
      
      if (!accessToken) {
        setError("No access token found");
        return;
      }
      
      try {
        // Exchange the access token for a session
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        
        if (error) throw error;
        
        if (data.session?.user) {
          // Check if this is a signup or login to validate accordingly
          const userEmail = data.session.user.email;
          
          if (userEmail) {
            setEmail(userEmail);
            const userExists = await checkIfUserExists(userEmail);
            
            // If signup flow but user exists
            if (isSignupFlow && userExists) {
              setError("Account already exists. Please use the login option instead.");
              return;
            }
            
            // If login flow but user doesn't exist
            if (!isSignupFlow && !userExists) {
              setError("Account doesn't exist. Please sign up first.");
              return;
            }
            
            // Success case
            toast({
              title: isSignupFlow ? "Signup successful!" : "Login successful!",
              description: "Welcome to Aura Hai!",
            });
            
            navigate('/dashboard');
          }
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setError(error.message || "Authentication failed");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Authentication failed",
        });
      }
    };

    processAuth();
  }, [searchParams, navigate, toast, checkIfUserExists]);

  const goToSignup = () => {
    navigate('/?signup=true');
  };

  const goToLogin = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A] p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Authentication Error</h2>
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative mb-6">
            <p className="text-center">{error}</p>
          </div>
          {email && (
            <p className="text-center mb-6">
              Email: <strong>{email}</strong>
            </p>
          )}
          {error.includes("already exists") ? (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Already have an account?</p>
              <Button 
                onClick={goToLogin}
                className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] hover:opacity-90"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Don't have an account yet?</p>
              <Button 
                onClick={goToSignup}
                className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] hover:opacity-90"
              >
                Go to Signup
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A]">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4">
            Authenticating...
          </h2>
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#FF007F] to-[#00DDEB] mb-4" />
          <p className="text-gray-600">Just a moment, please...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
