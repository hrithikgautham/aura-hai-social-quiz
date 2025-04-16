
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AuraCalculationInfo } from '@/components/quiz/AuraCalculationInfo';
import { auraColors } from '@/utils/auraCalculations';

// Define colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface ResponseData {
  id: string;
  respondent_id: string;
  answers: Record<string, any>;
  aura_points: number;
  quiz_id: string;
  created_at: string;
}

interface QuestionData {
  id: string;
  text: string;
  type: string;
  is_fixed: boolean;
  options: string[];
}

const QuizAnalytics = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [quizName, setQuizName] = useState('');
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [auraDistribution, setAuraDistribution] = useState<ChartData[]>([]);
  const [chartData, setChartData] = useState<Record<string, { name: string; count: number }[]>>({});
  
  useEffect(() => {
    if (!quizId) return;
    
    const fetchQuizData = async () => {
      setLoading(true);
      
      try {
        // Fetch the quiz name
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('name, creator_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) throw quizError;
        
        // Only allow the creator to view analytics
        if (quizData.creator_id !== user?.id) {
          navigate('/dashboard');
          return;
        }
        
        setQuizName(quizData.name);
        
        // Fetch the quiz questions
        const { data: quizQuestions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('question_id')
          .eq('quiz_id', quizId);
        
        if (questionsError) throw questionsError;
        
        // Get the question IDs
        const questionIds = quizQuestions.map(q => q.question_id);
        
        // Fetch the actual question details
        const { data: questionDetails, error: detailsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);
        
        if (detailsError) throw detailsError;
        
        // Parse the options for each question
        const processedQuestions = questionDetails.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        
        setQuestions(processedQuestions);
        
        // Fetch all responses
        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select('*')
          .eq('quiz_id', quizId);
        
        if (responseError) throw responseError;
        
        setResponses(responseData || []);
        
        // Process aura distribution
        const auraPoints: Record<string, number> = {
          'Red': 0,
          'Orange': 0,
          'Yellow': 0,
          'Green': 0,
          'Blue': 0,
          'Purple': 0
        };
        
        responseData.forEach((response: ResponseData) => {
          // If the aura points is between specific ranges, assign it to the corresponding aura color
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
            color: auraColors[name.toLowerCase()]
          }));
        
        setAuraDistribution(auraChartData);
        
        // Process answer distribution for each question
        const answerData: Record<string, { name: string; count: number }[]> = {};
        
        processedQuestions.forEach(question => {
          const counts: Record<string, number> = {};
          
          responseData.forEach((response: ResponseData) => {
            const answer = response.answers[question.id];
            if (answer !== undefined) {
              if (!counts[answer]) counts[answer] = 0;
              counts[answer]++;
            }
          });
          
          answerData[question.id] = question.options.map((option, index) => ({
            name: option,
            count: counts[index] || 0
          }));
        });
        
        setChartData(answerData);
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
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={auraDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => {
                              // Ensure percent is a number before calculating
                              const percentValue = Number(percent);
                              return `${name} ${Math.round(percentValue * 100)}%`;
                            }}
                          >
                            {COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
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
                            {chartData[question.id] && (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartData[question.id]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                    label={({ name, percent }) => {
                                      // Ensure percent is a number before calculating
                                      const percentValue = Number(percent);
                                      return `${Math.round(percentValue * 100)}%`;
                                    }}
                                  >
                                    {chartData[question.id].map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
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
};

export default QuizAnalytics;
