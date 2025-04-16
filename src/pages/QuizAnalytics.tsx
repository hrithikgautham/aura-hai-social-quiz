
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponseData, QuestionData, ChartData } from '@/types/quiz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip
} from 'recharts';
import { 
  ChartContainer
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

export default function QuizAnalytics() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [quizName, setQuizName] = useState('');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [chartData, setChartData] = useState<Record<string, { name: string; count: number; fill?: string }[]>>({});
  const [userResponse, setUserResponse] = useState<ResponseData | null>(null);
  const [hasAccess, setHasAccess] = useState(true);
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
          // Parse answers if they're a string
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
            // Ensure user response has properly parsed answers
            setUserResponse({
              ...userResp,
              answers: typeof userResp.answers === 'string' 
                ? JSON.parse(userResp.answers) 
                : userResp.answers
            });
          }
        }
        
        // Create chart data for each question
        const updatedChartData: Record<string, { name: string; count: number; fill?: string }[]> = {};
        
        processedQuestions.forEach(question => {
          const questionAnswers: Record<string, number> = {};
          
          // Count answers for each question
          processedResponses.forEach(response => {
            const answer = response.answers[question.id];
            if (answer) {
              if (!questionAnswers[answer]) {
                questionAnswers[answer] = 0;
              }
              questionAnswers[answer]++;
            }
          });
          
          // Ensure all options have a count, even if zero
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{loading ? 'Loading...' : `${quizName} Analytics`}</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
        
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
                  <CardDescription>Your answers to this quiz</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserAnswerCard
                    response={userResponse}
                    questions={questions}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Question Analysis</CardTitle>
                <CardDescription>Distribution of responses per question</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Select
                    value={selectedQuestionIndex.toString()}
                    onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a question to analyze" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((question, index) => (
                        <SelectItem key={question.id} value={index.toString()}>
                          Question {index + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {questions[selectedQuestionIndex] && (
                    <div className="p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium mb-2">{questions[selectedQuestionIndex].text}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-64">
                          {questions[selectedQuestionIndex] && chartData[questions[selectedQuestionIndex].id] && 
                           chartData[questions[selectedQuestionIndex].id].some(item => item.count > 0) ? (
                            <ChartContainer
                              config={
                                chartData[questions[selectedQuestionIndex].id].reduce((acc, item, idx) => {
                                  acc[item.name] = { color: COLORS[idx % COLORS.length] };
                                  return acc;
                                }, {} as Record<string, { color: string }>)
                              }
                            >
                              <PieChart>
                                <Pie
                                  data={chartData[questions[selectedQuestionIndex].id]}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  dataKey="count"
                                  nameKey="name"
                                  label
                                >
                                  {chartData[questions[selectedQuestionIndex].id].map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.fill || COLORS[index % COLORS.length]} 
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ChartContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <p className="text-gray-500">No data available</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Response Breakdown</h4>
                          {questions[selectedQuestionIndex] && chartData[questions[selectedQuestionIndex].id] && 
                           chartData[questions[selectedQuestionIndex].id].map((item, idx) => (
                            <div key={idx} className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                                <span>{item.name}</span>
                              </div>
                              <span>
                                {item.count} ({responses.length > 0 
                                  ? `${Math.round((item.count / responses.length) * 100)}%` 
                                  : '0%'}
                                )
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
