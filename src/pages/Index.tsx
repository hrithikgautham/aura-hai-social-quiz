
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold mb-4">Welcome, {user.username}!</h1>
          <Button onClick={logout} variant="outline">Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Aura Hai!</h1>
        <p className="text-xl text-gray-600">Discover your social aura</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Index;
