
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
          {showSignup ? "Sign Up for Aura Hai!" : "Welcome to Aura Hai!"}
        </h2>
        <LoginForm isSignup={showSignup} />
        <div className="mt-4 text-center">
          <button 
            onClick={() => setShowSignup(!showSignup)} 
            className="text-[#FF007F] hover:underline"
          >
            {showSignup 
              ? "Already have an account? Login" 
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
