
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Share2, BarChart3 } from 'lucide-react';
import { QuizCard } from '@/components/quiz/QuizCard';
import { QuizLimitModal } from '@/components/quiz/QuizLimitModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchQuizzes = async () => {
      try {
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*, responses(count)')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (quizzesError) throw quizzesError;

        setQuizzes(quizzesData || []);
        setQuizCount(quizzesData?.length || 0);

        // If they have at least 3 quizzes, check response counts for the first 3
        if ((quizzesData?.length || 0) >= 3 && quizzesData) {
          const firstThreeIds = quizzesData
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, 3)
            .map(quiz => quiz.id);

          const { data: responsesData, error: responsesError } = await supabase
            .from('responses')
            .select('count')
            .in('quiz_id', firstThreeIds);

          if (responsesError) throw responsesError;
          
          setResponseCount(responsesData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quizzes. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [user, toast]);

  const handleCreateQuiz = () => {
    // Calculate allowed quiz count: 3 initial + 1 for each 10 responses
    const allowedQuizzes = 3 + Math.floor(responseCount / 10);
    
    if (quizCount < allowedQuizzes) {
      navigate('/quiz/create');
    } else {
      setShowLimitModal(true);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase">Your Aura</h1>
          <p className="text-gray-600">Welcome, {user.username}!</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateQuiz}
            className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
          <Button 
            onClick={() => logout()} 
            variant="outline"
            className="hover:scale-105 transition-transform"
          >
            Logout
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No quizzes created yet</h2>
          <p className="text-gray-500 mb-6">Create your first quiz to start measuring your aura!</p>
          <Button 
            onClick={handleCreateQuiz}
            className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <QuizCard 
              key={quiz.id} 
              quiz={quiz} 
              onViewAnalytics={() => navigate(`/quiz/${quiz.id}/analytics`)}
            />
          ))}
        </div>
      )}

      <QuizLimitModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        responseCount={responseCount}
        requiredResponses={10}
        nextUnlockAt={Math.ceil(responseCount / 10) * 10}
      />
    </div>
  );
};

export default Dashboard;
