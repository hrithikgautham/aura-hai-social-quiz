import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <LoginForm />
    </div>
  );
};

export default Index;
