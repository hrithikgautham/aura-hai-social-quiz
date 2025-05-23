import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateMCQAuraPoints } from '@/utils/auraCalculations';
import { QuizAnalyticsLayout } from '@/components/quiz/analytics/QuizAnalyticsLayout';
import { QuizHeaderCard } from '@/components/quiz/analytics/QuizHeaderCard';
import { AuraPointsChart } from '@/components/quiz/analytics/AuraPointsChart';
import { ResponsesTable } from '@/components/quiz/analytics/ResponsesTable';
import { ShareDialog } from '@/components/quiz/analytics/ShareDialog';
import { DeleteDialog } from '@/components/quiz/analytics/DeleteDialog';
import { ChartsSection } from '@/components/quiz/analytics/ChartsSection';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { QuizData, AuraPoints } from '@/types/quiz-analytics';
import PageLayout from '@/components/layout/PageLayout';
import { useToast } from '@/hooks/use-toast';

const QuizSummary = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionAuraPoints, setQuestionAuraPoints] = useState<{ [questionId: string]: AuraPoints }>({});
  const [overallAuraPoints, setOverallAuraPoints] = useState<AuraPoints>({
    innovator: 0,
    motivator: 0,
    achiever: 0,
    supporter: 0,
    guardian: 0,
    visionary: 0
  });
  
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [quizDescription, setQuizDescription] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchQuizAndResponses = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          throw new Error(`Failed to fetch quiz: ${quizError.message}`);
        }

        if (!quizData) {
          throw new Error('Quiz not found');
        }

        console.log('Fetched quiz data:', quizData);
        setQuiz(quizData);
        setIsPublic(false);
        setQuizName(quizData.name);
        setQuizDescription('');

        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select(`
            *,
            users (
              username,
              avatar_url
            )
          `)
          .eq('quiz_id', quizId);

        if (responsesError) {
          throw new Error(`Failed to fetch quiz responses: ${responsesError.message}`);
        }

        console.log('Fetched responses:', responsesData);
        
        const responseArray = responsesData || [];
        setQuizResponses(responseArray);
        
        if (responseArray.length === 0) {
          console.log('No responses found for this quiz.');
          setLoading(false);
          return;
        }

        const calculatedQuestionAuraPoints: { [questionId: string]: AuraPoints } = {};
        const calculatedOverallAuraPoints: AuraPoints = {
          innovator: 0,
          motivator: 0,
          achiever: 0,
          supporter: 0,
          guardian: 0,
          visionary: 0
        };

        responseArray.forEach(response => {
          const answers = typeof response.answers === 'string' 
            ? JSON.parse(response.answers) 
            : response.answers;
          
          console.log('Processing response answers:', answers);
            
          if (answers && Object.keys(answers).length > 0) {
            const quizQuestions = quiz?.questions || {};
            
            Object.entries(answers).forEach(([questionId, answer]) => {
              const questionIdStr = String(questionId);
              console.log('Processing question:', questionIdStr, 'with answer:', answer);
              
              if (quizQuestions[questionIdStr] && quizQuestions[questionIdStr].options) {
                const auraPoints = calculateMCQAuraPoints(answer as string);
                console.log('Calculated aura points:', auraPoints);

                if (!calculatedQuestionAuraPoints[questionIdStr]) {
                  calculatedQuestionAuraPoints[questionIdStr] = {
                    innovator: 0,
                    motivator: 0,
                    achiever: 0,
                    supporter: 0,
                    guardian: 0,
                    visionary: 0
                  };
                }

                Object.keys(calculatedOverallAuraPoints).forEach(aura => {
                  const auraKey = aura as keyof AuraPoints;
                  calculatedQuestionAuraPoints[questionIdStr][auraKey] += auraPoints[auraKey];
                  calculatedOverallAuraPoints[auraKey] += auraPoints[auraKey];
                });
              }
            });
          }
        });

        console.log('Final calculated question aura points:', calculatedQuestionAuraPoints);
        console.log('Final calculated overall aura points:', calculatedOverallAuraPoints);
        
        setQuestionAuraPoints(calculatedQuestionAuraPoints);
        setOverallAuraPoints(calculatedOverallAuraPoints);
        
        toast({
          title: "Data loaded successfully",
          description: `Loaded ${responseArray.length} responses for analysis`,
          duration: 2000,
        });
      } catch (err: any) {
        setError(err.message);
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to load quiz data",
        });
        console.error("Error fetching quiz data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndResponses();
  }, [quizId, user, navigate, toast]);

  const handleShareQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: quizName,
          shareable_link: quiz?.shareable_link || ''
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz: ${error.message}`);
      }

      setIsPublic(true);

      const link = `${window.location.origin}/quiz/take/${quizId}`;
      setShareableLink(link);
      setIsShareDialogOpen(true);
      
      toast({
        title: "Quiz shared",
        description: "The quiz is now shareable with the provided link",
      });
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error sharing",
        description: err.message || "Failed to share quiz",
      });
      console.error("Error sharing quiz:", err);
    }
  };

  const handleDeleteQuiz = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to delete quiz: ${error.message}`);
      }

      toast({
        title: "Quiz deleted",
        description: "Quiz has been permanently deleted",
      });
      
      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error deleting",
        description: err.message || "Failed to delete quiz",
      });
      console.error("Error deleting quiz:", err);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleQuizUpdate = (name: string, description: string, isPublic: boolean) => {
    setQuizName(name);
    setQuizDescription(description);
    setIsPublic(isPublic);
    setQuiz(prev => prev ? { ...prev, name } : null);
    
    toast({
      title: "Quiz updated",
      description: "Quiz details have been updated successfully",
    });
  };

  const transformedQuestions = useMemo(() => {
    if (!quiz?.questions) return [];
    
    return Object.entries(quiz.questions).map(([id, q]) => ({
      id,
      text: q.text,
      type: q.type,
      options: q.options
    }));
  }, [quiz?.questions]);

  console.log('Transformed questions for ChartsSection:', transformedQuestions);
  console.log('Quiz responses for ChartsSection:', quizResponses);

  return (
    <PageLayout isAnalytics>
      <DeleteDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        shareableLink={shareableLink}
      />

      <QuizHeaderCard
        quizName={quizName}
        quizDescription={quizDescription}
        quizId={quizId}
        isPublic={isPublic}
        onDelete={handleDeleteQuiz}
        onShare={handleShareQuiz}
        onUpdate={handleQuizUpdate}
      />

      <div className="mt-6">
        <LeaderboardCard responses={quizResponses} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <AuraPointsChart overallAuraPoints={overallAuraPoints} />
        {user && (
          <ResponsesTable 
            quizResponses={quizResponses.filter(r => r.respondent_id === user.id)}
            quiz={quiz}
            quizName={quizName}
            quizId={quizId}
          />
        )}
      </div>

      <div className="mt-6">
        <ChartsSection 
          questions={transformedQuestions} 
          responses={quizResponses} 
        />
      </div>
    </PageLayout>
  );
};

export default QuizSummary;
