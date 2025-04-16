
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponseData, QuestionData, ChartData } from '@/types/quiz';
import { auraColors } from '@/utils/auraCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { LeaderboardCard } from '@/components/quiz/LeaderboardCard';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AuraCalculationInfo } from '@/components/quiz/AuraCalculationInfo';

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
  const [auraDistribution, setAuraDistribution] = useState<ChartData[]>([]);
  const [chartData, setChartData] = useState<Record<string, { name: string; count: number; fill?: string }[]>>({});
  const [userResponse, setUserResponse] = useState<ResponseData | null>(null);
  const [hasAccess, setHasAccess] = useState(true);

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
            setUserResponse(userResp);
          }
        }
        
        const auraPoints: Record<string, number> = {
          'Red': 0,
          'Orange': 0,
          'Yellow': 0,
          'Green': 0,
          'Blue': 0,
          'Purple': 0
        };
        
        processedResponses.forEach((response: ResponseData) => {
          if (response.aura_points > 50) {
            auraPoints['Red']++;
          } else if (response.aura_points > 40) {
            auraPoints['Orange']++;
          } else if (response.aura_points > 30) {
            auraPoints['Yellow']++;
          } else if (response.aura_points > 20) {
            auraPoints['Green']++;
          } else if (response.aura_points > 10) {
            auraPoints['Blue']++;
          } else {
            auraPoints['Purple']++;
          }
        });
        
        const auraChartData = Object.entries(auraPoints)
          .filter(([_, count]) => count > 0)
          .map(([name, value], index) => ({
            name,
            value,
            color: auraColors[name.toLowerCase()] || COLORS[index % COLORS.length]
          }));
        
        setAuraDistribution(auraChartData);
        
        // Fix for Question Analysis Charts
        const updatedChartData: Record<string, { name: string; count: number; fill?: string }[]> = {};
        
        processedQuestions.forEach(question => {
          const questionAnswers: Record<string, number> = {};
          
          // Count each answer for this question
          processedResponses.forEach(response => {
            const answer = response.answers[question.id];
            if (answer) {
              if (!questionAnswers[answer]) {
                questionAnswers[answer] = 0;
              }
              questionAnswers[answer]++;
            }
          });
          
          // Convert to chart format with colors
          if (question.options && Array.isArray(question.options)) {
            const chartItems = question.options.map((option: string, index: number) => ({
              name: option,
              count: questionAnswers[option] || 0,
              fill: COLORS[index % COLORS.length]
            }));
            
            // Only add questions that have at least one answer
            if (chartItems.some(item => item.count > 0)) {
              updatedChartData[question.id] = chartItems;
            } else {
              // Add empty data for questions with no responses
              updatedChartData[question.id] = chartItems;
            }
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
            {userResponse && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Responses</CardTitle>
                  <CardDescription>Here are your answers to this quiz</CardDescription>
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
                <CardTitle>Quiz Summary</CardTitle>
                <CardDescription>Overview of responses and aura distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Total Responses</h3>
                    <div className="text-3xl font-bold">{responses.length}</div>
                    
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">How Aura Scores are Calculated</h3>
                      <AuraCalculationInfo />
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <h3 className="font-medium mb-2 text-center">Aura Distribution</h3>
                    {auraDistribution.length > 0 ? (
                      <ChartContainer
                        config={{
                          Red: { color: auraColors.red },
                          Orange: { color: auraColors.orange },
                          Yellow: { color: auraColors.yellow },
                          Green: { color: auraColors.green },
                          Blue: { color: auraColors.blue },
                          Purple: { color: auraColors.purple }
                        }}
                      >
                        <PieChart>
                          <Pie
                            data={auraDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => {
                              const percentValue = typeof percent === 'number' ? percent : Number(percent);
                              return `${name} ${Math.round(percentValue * 100)}%`;
                            }}
                          >
                            {auraDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border rounded shadow-md">
                                  <p>{`${payload[0].name}: ${payload[0].value} (${Math.round(payload[0].percent * 100)}%)`}</p>
                                </div>
                              );
                            }
                            return null;
                          }} />
                          <Legend />
                        </PieChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <LeaderboardCard responses={responses} />
            
            <Card>
              <CardHeader>
                <CardTitle>Question Analysis</CardTitle>
                <CardDescription>Breakdown of responses per question</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="question-0">
                  <TabsList className="mb-4 flex-wrap">
                    {questions.map((question, index) => (
                      <TabsTrigger key={question.id} value={`question-${index}`}>
                        Question {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {questions.map((question, index) => (
                    <TabsContent key={question.id} value={`question-${index}`} className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-md">
                        <h3 className="font-medium mb-2">{question.text}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="h-64">
                            {chartData[question.id] && chartData[question.id].length > 0 ? (
                              <ChartContainer
                                config={
                                  chartData[question.id].reduce((acc, item, idx) => {
                                    acc[item.name] = { color: COLORS[idx % COLORS.length] };
                                    return acc;
                                  }, {} as Record<string, { color: string }>)
                                }
                              >
                                <PieChart>
                                  <Pie
                                    data={chartData[question.id]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="count"
                                    nameKey="name"
                                    label={({ name, percent }) => {
                                      if (!percent) return null;
                                      const percentValue = typeof percent === 'number' ? percent : Number(percent);
                                      return percentValue > 0 ? `${Math.round(percentValue * 100)}%` : null;
                                    }}
                                  >
                                    {chartData[question.id].map((entry, idx) => (
                                      <Cell 
                                        key={`cell-${idx}`} 
                                        fill={COLORS[idx % COLORS.length]} 
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="bg-white p-2 border rounded shadow text-sm">
                                            <p>{`${payload[0].name}: ${payload[0].value} responses`}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
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
                            {chartData[question.id] && chartData[question.id].map((item, idx) => (
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
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Individual Responses</CardTitle>
                <CardDescription>Detailed view of each respondent's answers</CardDescription>
              </CardHeader>
              <CardContent>
                {responses.length > 0 ? (
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <UserAnswerCard
                        key={response.id}
                        response={response}
                        questions={questions}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No responses yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
