
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A] p-4">
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-5xl font-bold uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
          Aura Hai!
        </h1>
        <p className="text-xl text-gray-600">Discover your social aura</p>
        <p className="text-gray-500 max-w-md mx-auto">
          Create quizzes, share them with friends, and see how your aura measures up!
        </p>
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignup ? "Create Account" : "Welcome to Aura Hai!"}
        </h2>
        <LoginForm isSignup={isSignup} />
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-2">
            {isSignup 
              ? "Already have an account?" 
              : "Don't have an account yet?"}
          </p>
          <Button 
            variant="link" 
            onClick={() => setIsSignup(!isSignup)}
            className="text-[#FF007F] hover:text-[#00DDEB]"
          >
            {isSignup ? "Log in instead" : "Sign up instead"}
          </Button>
        </div>
        
        {user && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-2">Already logged in</p>
            <Button 
              variant="default" 
              onClick={() => navigate('/dashboard')}
              className="bg-[#FF007F] hover:bg-[#D6006C]"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
