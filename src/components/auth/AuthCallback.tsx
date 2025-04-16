
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QuirkyLoading } from '../layout/QuirkyLoading';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session information
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          // Authentication successful
          toast({
            title: "Login successful!",
            description: "Welcome to Aura Hai!",
          });
          navigate('/dashboard', { replace: true });
        } else {
          // No session found
          toast({
            variant: "destructive",
            title: "Authentication error",
            description: "Could not complete the sign-in. Please try again.",
          });
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Could not complete the sign-in. Please try again.",
        });
        navigate('/', { replace: true });
      }
    };
    
    handleAuthCallback();
  }, [navigate, toast]);
  
  return <QuirkyLoading message="Completing your sign-in..." />;
};

export default AuthCallback;
