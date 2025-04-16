
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AnalyticsHeaderProps {
  quizName: string;
  loading: boolean;
}

export function AnalyticsHeader({ quizName, loading }: AnalyticsHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">{loading ? 'Loading...' : `${quizName} Analytics`}</h1>
      <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  );
}
