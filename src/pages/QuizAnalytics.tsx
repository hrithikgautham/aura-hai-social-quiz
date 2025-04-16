import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const COLORS = ['#FF007F', '#00DDEB', '#00FF5E', '#FFD700'];

const QuizAnalytics = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<Record<string, any[]>>({});

  // New state for leaderboard data
  const [leaderboard, setLeaderboard] = useState<Array<{
    username: string;
    aura_points: number;
  }>>([]);

  useEffect(() => {
    if (!quizId || !user) return;

    const fetchQuizData = async () => {
      setLoading(true);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*, users:creator_id(username)')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;

        if (quizData.creator_id !== user.id) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You can only view analytics for quizzes you created.",
          });
          navigate('/dashboard');
          return;
        }

        setQuiz(quizData);

        // Add quiz creator to leaderboard with 100k points
        setLeaderboard([
          { username: quizData.users.username, aura_points: 100000 },
        ]);

        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select(`
            aura_points,
            users:respondent_id(username)
          `)
          .eq('quiz_id', quizId)
          .order('aura_points', { ascending: false });

        if (responseError) throw responseError;

        if (responseData) {
          const formattedLeaderboard = responseData.map(response => ({
            username: response.users?.username || 'Anonymous',
            aura_points: response.aura_points,
          }));
          setLeaderboard(prev => [...prev, ...formattedLeaderboard]);
        }

        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .select(`
            id,
            priority_order,
            correct_answer,
            questions:question_id(id, text, type, options)
          `)
          .eq('quiz_id', quizId);

        if (questionError) throw questionError;

        if (questionData) {
          const formattedQuestions = questionData.map(item => {
            let priorityOrder = null;
            if (item.priority_order) {
              try {
                priorityOrder = typeof item.priority_order === 'string' 
                  ? JSON.parse(item.priority_order) 
                  : item.priority_order;
              } catch (error) {
                console.error('Error parsing priority order:', error);
              }
            }

            let options = undefined;
            if (item.questions.options) {
              try {
                options = typeof item.questions.options === 'string'
                  ? JSON.parse(item.questions.options)
                  : item.questions.options;
              } catch (error) {
                console.error('Error parsing options:', error);
              }
            }

            return {
              id: item.id,
              questionId: item.questions.id,
              text: item.questions.text,
              type: item.questions.type as 'mcq' | 'number',
              options,
              priority_order: priorityOrder,
              correct_answer: item.correct_answer,
            };
          });
          
          setQuestions(formattedQuestions);
        }

        const { data: responseData2, error: responseError2 } = await supabase
          .from('responses')
          .select(`
            id,
            answers,
            aura_points,
            created_at,
            users:respondent_id(username)
          `)
          .eq('quiz_id', quizId);

        if (responseError2) throw responseError2;
        setResponses(responseData2 || []);

        if (questionData) {
          if (responseData2) {
            const charts: Record<string, any[]> = {};

            questionData.forEach(question => {
              let options;
              try {
                options = typeof question.questions.options === 'string' 
                  ? JSON.parse(question.questions.options) 
                  : question.questions.options;
              } catch (error) {
                console.error('Error parsing options:', error);
                options = [];
              }

              if (Array.isArray(options)) {
                const total = responseData2.length;
                const optionCounts = options.reduce((acc: Record<string, number>, opt: string) => {
                  acc[opt] = 0;
                  return acc;
                }, {});

                responseData2.forEach(response => {
                  const answer = response.answers && response.answers[question.id];
                  if (answer && optionCounts.hasOwnProperty(answer)) {
                    optionCounts[answer]++;
                  }
                });

                charts[question.id] = Object.entries(optionCounts).map(([option, count]) => ({
                  option,
                  count,
                  percentage: total > 0 ? Math.round((count / total) * 100) : 0
                }));
              }
            });

            setChartData(charts);
          }
        }
      } catch (error) {
        console.error('Error fetching quiz analytics:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz analytics. Please try again.",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, user, navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
              {quiz?.name}
            </h1>
            <p className="text-gray-600">View how others responded to this quiz</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Leaderboard Table */}
        <Card className="mb-8 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
              Top Aura Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Aura Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell>{entry.aura_points.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card className="mb-8 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
              Aura Points Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Legendary (90k+)', value: responses.filter(r => r.aura_points >= 90000).length },
                    { name: 'Amazing (75-90k)', value: responses.filter(r => r.aura_points >= 75000 && r.aura_points < 90000).length },
                    { name: 'Good (50-75k)', value: responses.filter(r => r.aura_points >= 50000 && r.aura_points < 75000).length },
                    { name: 'Developing (<50k)', value: responses.filter(r => r.aura_points < 50000).length },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Question Response Charts */}
        <h2 className="text-2xl font-bold mt-8 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
          Question Responses
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">
                  Q{index + 1}: {question.text}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-72">
                {chartData[question.id] && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData[question.id]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ option, percentage }) => `${option}: ${percentage}%`}
                      >
                        {chartData[question.id].map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={({ payload }) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 shadow rounded">
                              <p className="font-medium">{data.option}</p>
                              <p>{data.count} responses ({data.percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {(!chartData[question.id] || chartData[question.id].length === 0) && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No responses yet
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizAnalytics;
