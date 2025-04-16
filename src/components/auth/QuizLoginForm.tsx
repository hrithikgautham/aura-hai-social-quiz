
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useLocation, useParams } from 'react-router-dom';

export const QuizLoginForm = ({ quizCreator }: { quizCreator?: string }) => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const { login, signup } = useAuth();
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
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();

        setExists(!!data);
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 300);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      toast({
        variant: "destructive",
        title: "Invalid username",
        description: "Only letters, numbers, and underscores allowed",
      });
      return;
    }

    try {
      if (exists) {
        await login(username);
      } else {
        await signup(username);
      }
      toast({
        title: exists ? "Welcome back!" : "Account created!",
        description: `You're now logged in as ${username}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
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
        {username && !isChecking && !exists && (
          <p className="text-sm text-red-500">
            Username not found. Sign up with this username?
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={!username || isChecking}
        className="w-full bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
      >
        {exists ? 'Login' : 'Sign Up'}
      </Button>
    </form>
  );
};
