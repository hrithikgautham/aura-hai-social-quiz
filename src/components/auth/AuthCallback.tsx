
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QuirkyLoading from '../layout/QuirkyLoading'; 

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processed, setProcessed] = useState(false);
  const processingRef = useRef(false);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent duplicate processing
      if (processed || processingRef.current) return;
      processingRef.current = true;
      
      try {
        console.log("Processing auth callback");
        // Get the session information
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error.message);
          throw error;
        }
        
        if (session) {
          // Authentication successful
          console.log("Auth successful, session found");
          toast({
            title: "Login successful!",
            description: "Welcome to Aura Hai!",
          });
          navigate('/dashboard', { replace: true });
        } else {
          // No session found
          console.log("No session found during callback");
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
      } finally {
        setProcessed(true);
        processingRef.current = false;
      }
    };
    
    handleAuthCallback();
  }, [navigate, toast, processed]);
  
  return <QuirkyLoading />;
};

export default AuthCallback;
