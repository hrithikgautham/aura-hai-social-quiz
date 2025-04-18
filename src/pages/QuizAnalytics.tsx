
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateMCQAuraPoints } from '@/utils/auraCalculations';
import { QuizAnalyticsLayout } from '@/components/quiz/analytics/QuizAnalyticsLayout';
import { QuizHeaderCard } from '@/components/quiz/analytics/QuizHeaderCard';
import { AuraPointsChart } from '@/components/quiz/analytics/AuraPointsChart';
import { ResponsesTable } from '@/components/quiz/analytics/ResponsesTable';
import { ShareDialog } from '@/components/quiz/analytics/ShareDialog';
import { DeleteDialog } from '@/components/quiz/analytics/DeleteDialog';
import { ChartsSection } from '@/components/quiz/analytics/ChartsSection';
import { QuizData, AuraPoints } from '@/types/quiz-analytics';

const QuizAnalytics = () => {
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
  
  // UI state
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
        // Fetch quiz details
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

        // Initialize with default empty values
        setQuiz(quizData);
        setIsPublic(false); // Default to false
        setQuizName(quizData.name);
        setQuizDescription(''); // Default to empty string

        // Fetch quiz responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('*, user_profiles(username)')
          .eq('quiz_id', quizId);

        if (responsesError) {
          throw new Error(`Failed to fetch quiz responses: ${responsesError.message}`);
        }

        if (!responsesData || responsesData.length === 0) {
          console.warn('No responses found for this quiz.');
          setLoading(false);
          return;
        }

        setQuizResponses(responsesData);

        // Calculate aura points for each question and overall
        const calculatedQuestionAuraPoints: { [questionId: string]: AuraPoints } = {};
        const calculatedOverallAuraPoints: AuraPoints = {
          innovator: 0,
          motivator: 0,
          achiever: 0,
          supporter: 0,
          guardian: 0,
          visionary: 0
        };

        responsesData.forEach(response => {
          const answers = response.answers || {};
          
          if (answers && Object.keys(answers).length > 0) {
            const quizQuestions = quiz?.questions || {};
            
            Object.entries(answers).forEach(([questionId, answer]) => {
              const questionIdStr = String(questionId);
              if (quizQuestions[questionIdStr] && quizQuestions[questionIdStr].options) {
                // Fix: Pass only one argument to calculateMCQAuraPoints
                const auraPoints = calculateMCQAuraPoints(answer as string);

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

        setQuestionAuraPoints(calculatedQuestionAuraPoints);
        setOverallAuraPoints(calculatedOverallAuraPoints);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching quiz data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndResponses();
  }, [quizId, user, navigate]);

  const handleShareQuiz = async () => {
    try {
      // Only updating fields that are known to exist in the schema
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
    } catch (err: any) {
      setError(err.message);
      console.error("Error sharing quiz:", err);
      toast({
        title: 'Error sharing quiz',
        description: 'There was an error sharing the quiz. Please try again.',
        variant: 'destructive',
      });
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
        title: 'Quiz deleted',
        description: 'The quiz has been successfully deleted.',
      });
      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting quiz:", err);
      toast({
        title: 'Error deleting quiz',
        description: 'There was an error deleting the quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleQuizUpdate = (name: string, description: string, isPublic: boolean) => {
    setQuizName(name);
    setQuizDescription(description);
    setIsPublic(isPublic);
    setQuiz(prev => prev ? { ...prev, name } : null);
  };

  return (
    <QuizAnalyticsLayout 
      title={`${quizName} Analytics`}
      loading={loading}
      error={error}
    >
      {/* Delete Confirmation Dialog */}
      <DeleteDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteQuiz}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      {/* Share Quiz Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        shareableLink={shareableLink}
      />

      {/* Quiz Header Card */}
      <QuizHeaderCard
        quizName={quizName}
        quizDescription={quizDescription}
        quizId={quizId}
        isPublic={isPublic}
        onDelete={handleDeleteQuiz}
        onShare={handleShareQuiz}
        onUpdate={handleQuizUpdate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Aura Points Chart */}
        <AuraPointsChart overallAuraPoints={overallAuraPoints} />

        {/* Responses Table */}
        <ResponsesTable 
          quizResponses={quizResponses}
          quiz={quiz}
          quizName={quizName}
          quizId={quizId}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <ChartsSection questions={quiz?.questions ? Object.values(quiz.questions).map((q, i) => ({
          id: Object.keys(quiz.questions || {})[i],
          text: q.text,
          type: q.type,
          options: q.options
        })) : []} responses={quizResponses} />
      </div>
    </QuizAnalyticsLayout>
  );
};

export default QuizAnalytics;
