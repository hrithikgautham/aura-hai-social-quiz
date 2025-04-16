import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizCard } from '@/components/quiz/QuizCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createdQuizzes, setCreatedQuizzes] = useState<any[]>([]);
  const [takenQuizzes, setTakenQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
	const [customQuestionsSelected, setCustomQuestionsSelected] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        // Fetch quizzes created by the user
        const { data: createdData, error: createdError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', user.id);

        if (createdError) throw createdError;
        setCreatedQuizzes(createdData || []);

        // Fetch quizzes taken by the user (where the user has submitted a response)
        const { data: takenData, error: takenError } = await supabase
          .from('responses')
          .select('*, quizzes(*)')
          .eq('respondent_id', user.id)
          .not('quizzes', 'is', null);

        if (takenError) throw takenError;

        // Extract the quiz objects from the responses
        const takenQuizList = takenData ? takenData.map(response => response.quizzes) : [];
        setTakenQuizzes(takenQuizList || []);
				
				// Check if custom questions have been selected
				if (createdData && createdData.length > 0) {
					const hasCustomQuestions = createdData.some(quiz => quiz.custom_questions);
					setCustomQuestionsSelected(hasCustomQuestions);
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
  }, [user, navigate, toast]);

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

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Aura Dashboard</h1>
          <div className="flex gap-4">
            {customQuestionsSelected && (
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
                    onAnalytics={() => navigate(`/quiz/${quiz.id}/analytics`)}
                    actionButtons={
                      <Button
                        onClick={() => handleCopyLink(quiz.shareable_link)}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                    }
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
                    onView={() => navigate(`/quiz/${quiz.id}/results`)}
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
