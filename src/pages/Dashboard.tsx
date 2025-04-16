import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizCard } from '@/components/quiz/QuizCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createdQuizzes, setCreatedQuizzes] = useState<any[]>([]);
  const [takenQuizzes, setTakenQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inProgressQuizzes, setInProgressQuizzes] = useState<any[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [previousUnlockedSlots, setPreviousUnlockedSlots] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const { data: createdData, error: createdError } = await supabase
          .from('quizzes')
          .select('*, responses(*)')
          .eq('creator_id', user.id);

        if (createdError) throw createdError;
        setCreatedQuizzes(createdData || []);

        const { data: takenData, error: takenError } = await supabase
          .from('responses')
          .select('*, quizzes(*, responses(*))')
          .eq('respondent_id', user.id)
          .not('quizzes', 'is', null);

        if (takenError) throw takenError;

        const takenQuizList = takenData ? takenData.map(response => response.quizzes) : [];
        setTakenQuizzes(takenQuizList || []);

        const inProgressQuizIds = [];
        
        for (const quiz of createdData) {
          const { count: questionsCount } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id);
            
          if (questionsCount < 7) {
            inProgressQuizIds.push(quiz.id);
          }
        }
        
        const inProgress = createdData.filter(quiz => inProgressQuizIds.includes(quiz.id));
        setInProgressQuizzes(inProgress);

        if (createdData && createdData.length >= 3) {
          const { data: responseData } = await supabase
            .rpc('get_first_three_quizzes_response_count', {
              creator_uuid: user.id
            });
            
          setResponseCount(responseData || 0);
          
          const currentUnlockedSlots = Math.floor((responseData || 0) / 10);
          if (currentUnlockedSlots > previousUnlockedSlots) {
            toast({
              title: "New Quiz Slot Unlocked! 🎉",
              description: "You can now create another quiz!",
            });
            setPreviousUnlockedSlots(currentUnlockedSlots);
          }
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
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
  }, [user, navigate, toast, previousUnlockedSlots]);

  const handleCopyLink = (shareableLink: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${shareableLink}`);
    toast({
      title: "Link copied!",
      description: "Share it with your friends to measure their aura!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Aura Dashboard</h1>
          <div className="flex gap-4 items-center">
            {inProgressQuizzes.length > 0 && (
              <Button
                onClick={() => navigate('/quiz/create')}
                className="bg-[#00DDEB] hover:bg-[#00BBCC] hover:scale-105 transition-transform"
              >
                Continue Quiz Creation
              </Button>
            )}
            <Button
              onClick={() => navigate('/quiz/create')}
              className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
            >
              Create New Quiz
            </Button>
          </div>
        </div>

        <Tabs defaultValue="created" className="space-y-6">
          <TabsList>
            <TabsTrigger value="created">Created Quizzes</TabsTrigger>
            <TabsTrigger value="taken">Taken Quizzes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created" className="space-y-4">
            {createdQuizzes.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">No quizzes created yet</h2>
                <p className="text-gray-500 mb-4">Create your first quiz to start measuring your friends' auras!</p>
                <Button
                  onClick={() => navigate('/quiz/create')}
                  className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
                >
                  Create Quiz
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    onViewAnalytics={() => navigate(`/quiz/${quiz.id}/analytics`)}
                    showCopyLink
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="taken" className="space-y-4">
            {takenQuizzes.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-2">No quizzes taken yet</h2>
                <p className="text-gray-500">Ask your friends to share their quizzes with you!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {takenQuizzes.map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    showCreator
                    showCopyLink
                    onView={() => navigate(`/quiz/${quiz.id}/analytics`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
