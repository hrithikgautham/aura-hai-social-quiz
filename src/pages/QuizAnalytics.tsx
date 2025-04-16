import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponseData, QuestionData } from '@/types/quiz';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { AnalyticsHeader } from '@/components/quiz/analytics/AnalyticsHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionAnalysis } from '@/components/quiz/analytics/QuestionAnalysis';

export default function QuizAnalytics() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quizName, setQuizName] = useState('');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [chartData, setChartData] = useState<Record<string, { name: string; count: number }[]>>({});
  
  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuizData = async () => {
      setLoading(true);
      
      try {
        // Fetch quiz basic info
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('name, creator_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        // Check if user has permission or has taken the quiz
        if (quizData.creator_id !== user?.id) {
          const { data: userResponse } = await supabase
            .from('responses')
            .select('*')
            .eq('quiz_id', quizId)
            .eq('respondent_id', user.id)
            .single();
            
          if (!userResponse) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have access to view this quiz's analytics.",
            });
            navigate('/dashboard');
            return;
          }
        }
        
        setQuizName(quizData.name);
        
        // Fetch quiz questions
        const { data: quizQuestions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('question_id')
          .eq('quiz_id', quizId);
        
        if (questionsError) throw questionsError;
        
        const questionIds = quizQuestions.map(q => q.question_id);
        
        // Fetch question details
        const { data: questionDetails, error: detailsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);
        
        if (detailsError) throw detailsError;
        
        const processedQuestions = questionDetails.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        
        setQuestions(processedQuestions);
        
        // Fetch responses
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('*')
          .eq('quiz_id', quizId);
        
        if (responseError) throw responseError;
        
        if (!responseData || responseData.length === 0) {
          setLoading(false);
          return; // Early return if no responses
        }
        
        const processedResponses = responseData.map(response => {
          const parsedAnswers = typeof response.answers === 'string' 
            ? JSON.parse(response.answers) 
            : response.answers;
            
          return {
            ...response,
            answers: parsedAnswers
          };
        }) as ResponseData[];
        
        setResponses(processedResponses);
        
        // Process chart data
        if (processedQuestions.length > 0 && processedResponses.length > 0) {
          const newChartData: Record<string, { name: string; count: number }[]> = {};
          
          processedQuestions.forEach(question => {
            const answerCounts: Record<string, number> = {};
            
            processedResponses.forEach(response => {
              const answer = response.answers[question.id];
              if (answer !== undefined) {
                const answerText = question.options && Array.isArray(question.options) && answer < question.options.length 
                  ? question.options[answer] 
                  : String(answer);
                
                answerCounts[answerText] = (answerCounts[answerText] || 0) + 1;
              }
            });
            
            newChartData[question.id] = Object.entries(answerCounts).map(([name, count]) => ({
              name,
              count
            }));
          });
          
          setChartData(newChartData);
        }
        
      } catch (error) {
        console.error('Error fetching quiz analytics:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz analytics.",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [quizId, user, navigate, toast]);

  // Find user's response
  const userResponse = responses.find(r => r.respondent_id === user?.id);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <AnalyticsHeader quizName={quizName} loading={loading} />
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            {responses.length > 0 ? (
              <LeaderboardCard responses={responses} />
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600">No responses yet for this quiz.</p>
              </div>
            )}
            
            {questions.length > 0 && (
              <QuestionAnalysis 
                questions={questions}
                selectedQuestionIndex={selectedQuestionIndex}
                setSelectedQuestionIndex={setSelectedQuestionIndex}
                chartData={chartData}
                responses={responses}
              />
            )}
            
            {userResponse && (
              <UserAnswerCard 
                response={userResponse} 
                questions={questions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
