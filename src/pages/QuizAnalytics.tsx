import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponseData, QuestionData } from '@/types/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { AnalyticsHeader } from '@/components/quiz/analytics/AnalyticsHeader';
import { QuestionAnalysis } from '@/components/quiz/analytics/QuestionAnalysis';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

export default function QuizAnalytics() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [quizName, setQuizName] = useState('');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [chartData, setChartData] = useState<Record<string, { name: string; count: number; fill?: string }[]>>({});
  const [userResponse, setUserResponse] = useState<ResponseData | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);

  useEffect(() => {
    if (!quizId || !user) return;
    
    const fetchQuizData = async () => {
      setLoading(true);
      
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('name, creator_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        if (quizData.creator_id !== user?.id) {
          const { data: userResponse } = await supabase
            .from('responses')
            .select('*')
            .eq('quiz_id', quizId)
            .eq('respondent_id', user.id)
            .single();
            
          if (!userResponse) {
            navigate('/dashboard');
            return;
          }
        }
        
        setQuizName(quizData.name);
        
        const { data: quizQuestions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('question_id')
          .eq('quiz_id', quizId);
        
        if (questionsError) throw questionsError;
        
        const questionIds = quizQuestions.map(q => q.question_id);
        
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
        
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('*')
          .eq('quiz_id', quizId);
        
        if (responseError) throw responseError;
        
        const processedResponses = (responseData || []).map(response => {
          const parsedAnswers = typeof response.answers === 'string' 
            ? JSON.parse(response.answers) 
            : response.answers;
            
          return {
            ...response,
            answers: parsedAnswers
          };
        }) as ResponseData[];
        
        setResponses(processedResponses);
        
        if (user) {
          const userResp = processedResponses.find(r => r.respondent_id === user.id);
          if (userResp) {
            setUserResponse({
              ...userResp,
              answers: typeof userResp.answers === 'string' 
                ? JSON.parse(userResp.answers) 
                : userResp.answers
            });
          }
        }
        
        const updatedChartData: Record<string, { name: string; count: number; fill?: string }[]> = {};
        
        processedQuestions.forEach(question => {
          const questionAnswers: Record<string, number> = {};
          
          processedResponses.forEach(response => {
            const answer = response.answers[question.id];
            if (answer) {
              if (!questionAnswers[answer]) {
                questionAnswers[answer] = 0;
              }
              questionAnswers[answer]++;
            }
          });
          
          if (question.options && Array.isArray(question.options)) {
            const chartItems = question.options.map((option: string, index: number) => ({
              name: option,
              count: questionAnswers[option] || 0,
              fill: COLORS[index % COLORS.length]
            }));
            
            updatedChartData[question.id] = chartItems;
          }
        });
        
        setChartData(updatedChartData);
        console.log('Chart data prepared:', updatedChartData);
        
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <AnalyticsHeader quizName={quizName} loading={loading} />
        
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-8">
            <LeaderboardCard responses={responses} />
            
            {userResponse && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserAnswerCard
                    response={userResponse}
                    questions={questions}
                  />
                </CardContent>
              </Card>
            )}

            <QuestionAnalysis 
              questions={questions}
              selectedQuestionIndex={selectedQuestionIndex}
              setSelectedQuestionIndex={setSelectedQuestionIndex}
              chartData={chartData}
              responses={responses}
            />
          </div>
        )}
      </div>
    </div>
  );
}
