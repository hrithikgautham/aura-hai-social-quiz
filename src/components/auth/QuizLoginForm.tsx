
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

export const QuizLoginForm = ({ quizCreator }: { quizCreator?: string }) => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const { loginWithGoogle, checkUsernameExists } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 1) {
        setExists(null);
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return;
      }

      setIsChecking(true);
      try {
        const userExists = await checkUsernameExists(username);
        setExists(userExists);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 300);
    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameExists]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not log in with Google. Please try again.",
      });
    }
  };

  // Determine if the button should be disabled
  // Login: Button should be disabled until username is found in the database
  // Sign up: Button should be disabled until username is NOT found in the database
  const isGoogleButtonDisabled = username.length === 0 || isChecking || !exists;

  return (
    <form className="space-y-6 w-full max-w-sm">
      {quizCreator && (
        <div className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] p-4 rounded-lg text-white mb-4">
          <h3 className="font-bold text-lg mb-1">You're taking a quiz created by:</h3>
          <p className="text-xl font-bold">{quizCreator}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`pr-10 border-2 focus:animate-bounce ${
              username && !isChecking
                ? exists
                  ? 'border-green-500'
                  : 'border-red-500'
                : 'border-[#FF007F]'
            } font-bold`}
            pattern="[a-zA-Z0-9_]+"
            title="Only letters, numbers, and underscores allowed"
          />
          {username && !isChecking && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {exists ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <X className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>
        {username && !isChecking && (
          <p className="text-sm text-gray-500">
            {exists 
              ? "Username found. You can login with Google." 
              : "Username not found. Please check your username or sign up."}
          </p>
        )}
      </div>
      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleButtonDisabled}
        className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 hover:scale-105 transition-transform"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Login with Google
      </Button>
    </form>
  );
};
