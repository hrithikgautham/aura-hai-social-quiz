import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { QuizCard } from '@/components/quiz/QuizCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Baby, Rocket } from 'lucide-react';
import confetti from 'canvas-confetti';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import PageLayout from '@/components/layout/PageLayout';

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
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  useEffect(() => {
    console.log("Dashboard mounted, current user:", user);

    // Handle hash fragment for OAuth redirects - just log it for debugging
    if (window.location.hash) {
      console.log("Hash fragment detected in Dashboard:", window.location.hash);
    }

    // Only fetch data if user is authenticated and we haven't tried fetching yet
    if (user && !dataFetchAttempted) {
      fetchQuizzes();
      setDataFetchAttempted(true);
    } else if (!user) {
      // If no user, don't show loading state
      setLoading(false);
    }
  }, [user]);

  const fetchQuizzes = async () => {
    console.log("Fetching quizzes for user:", user?.id);
    setLoading(true);
    try {
      const { data: createdData, error: createdError } = await supabase
        .from('quizzes')
        .select('*, responses(*)')
        .eq('creator_id', user?.id);

      if (createdError) throw createdError;
      setCreatedQuizzes(createdData || []);

      const { data: takenData, error: takenError } = await supabase
        .from('responses')
        .select('*, quizzes(*, responses(*), users(*))')
        .eq('respondent_id', user?.id)
        .not('quizzes', 'is', null);

      if (takenError) throw takenError;

      const takenQuizList = takenData ? takenData.map(response => response.quizzes) : [];
      setTakenQuizzes(takenQuizList || []);

      const inProgressQuizIds = [];
      
      for (const quiz of createdData || []) {
        const { count: questionsCount } = await supabase
          .from('quiz_questions')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id);
          
        if (questionsCount < 7) {
          inProgressQuizIds.push(quiz.id);
        }
      }
      
      const inProgress = (createdData || []).filter(quiz => inProgressQuizIds.includes(quiz.id));
      setInProgressQuizzes(inProgress);

      if (createdData && createdData.length >= 3) {
        const { data: responseData } = await supabase
          .rpc('get_first_three_quizzes_response_count', {
            creator_uuid: user?.id
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

  const handleCopyLink = (shareableLink: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${shareableLink}`);
    toast({
      title: "Link copied!",
      description: "Share it with your friends to measure their aura!",
    });
  };

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

  const shootConfetti = () => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FF007F', '#00DDEB', '#FFD700', '#FF69B4', '#7B68EE']
    };

    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 2
    });

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 1.5,
        shapes: ['circle']
      });
    }, 150);
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  // If user is not defined, we'll let ProtectedRoute handle the redirection
  if (!user) {
    return null;
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB] animate-pulse">
            Your Aura Dashboard
          </h1>
          <div className="flex gap-4 items-center">
            {inProgressQuizzes.length > 0 ? (
              <Button
                onClick={() => navigate('/quiz/create')}
                className="bg-[#00DDEB] hover:bg-[#00BBCC] hover:scale-105 transition-transform group"
              >
                <Baby className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                Continue Quiz Creation
              </Button>
            ) : (
              <Button
                onClick={() => {
                  shootConfetti();
                  navigate('/quiz/create');
                }}
                className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform group relative overflow-hidden"
              >
                <Sparkles className="mr-2 h-4 w-4 group-hover:animate-spin transition-transform" />
                Create New Quiz
                <span className="absolute inset-0 bg-white/20 group-hover:translate-y-0 translate-y-full transition-transform duration-300" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {createdQuizzes.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Rocket className="w-16 h-16 mx-auto mb-4 text-[#FF007F] animate-bounce" />
              <h2 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
                No quizzes created yet
              </h2>
              <p className="text-gray-500 mb-4">Create your first quiz to start measuring your friends' auras!</p>
              <Button
                onClick={() => navigate('/quiz/create')}
                className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transform transition-all duration-300 animate-pulse"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Create Quiz
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {createdQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onViewAnalytics={() => navigate(`/quiz/${quiz.id}/summary`)}
                  showCopyLink
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
