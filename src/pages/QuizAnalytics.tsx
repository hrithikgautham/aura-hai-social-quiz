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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
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

        if (questionData && responseData2) {
          const charts: Record<string, any[]> = {};

          questionData.forEach(question => {
            const questionId = question.id;
            const questionType = question.questions.type;
            
            if (questionType === 'mcq') {
              let options;
              try {
                options = typeof question.questions.options === 'string' 
                  ? JSON.parse(question.questions.options) 
                  : question.questions.options;
              } catch (error) {
                console.error('Error parsing options:', error);
                options = [];
              }
              
              if (!Array.isArray(options)) {
                options = [];
              }
              
              const optionCounts = options.reduce((acc: Record<string, number>, opt: string) => {
                acc[opt] = 0;
                return acc;
              }, {});
              
              responseData2.forEach(response => {
                const answer = response.answers[questionId];
                if (answer && optionCounts.hasOwnProperty(answer)) {
                  optionCounts[answer]++;
                }
              });
              
              charts[questionId] = Object.entries(optionCounts).map(([option, count]) => ({
                option,
                count,
              }));
            } 
            else if (questionType === 'number') {
              const values = responseData2
                .map(response => {
                  const answer = response.answers[questionId];
                  return answer ? parseInt(answer.toString()) : null;
                })
                .filter(val => val !== null);
              
              if (values.length > 0) {
                const min = Math.min(...values);
                const max = Math.max(...values);
                const range = max - min;
                const binCount = Math.min(5, range + 1);
                const binSize = range / binCount || 1;
                
                const bins: Record<string, number> = {};
                
                for (let i = 0; i < binCount; i++) {
                  const binMin = min + i * binSize;
                  const binMax = min + (i + 1) * binSize;
                  const binLabel = `${Math.floor(binMin)}-${Math.ceil(binMax)}`;
                  bins[binLabel] = 0;
                }
                
                values.forEach(value => {
                  for (let i = 0; i < binCount; i++) {
                    const binMin = min + i * binSize;
                    const binMax = min + (i + 1) * binSize;
                    
                    if (value >= binMin && (value < binMax || (i === binCount - 1 && value <= binMax))) {
                      const binLabel = `${Math.floor(binMin)}-${Math.ceil(binMax)}`;
                      bins[binLabel]++;
                      break;
                    }
                  }
                });
                
                charts[questionId] = Object.entries(bins).map(([range, count]) => ({
                  range,
                  count,
                }));
              } else {
                charts[questionId] = [];
              }
            }
          });
          
          setChartData(charts);
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
            <h1 className="text-3xl font-bold">{quiz?.name}</h1>
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Aura Connections</CardTitle>
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
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell>{entry.aura_points.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Aura Points Distribution</CardTitle>
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
        <h2 className="text-2xl font-bold mt-8 mb-4">Question Responses</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((question, index) => (
            <Card key={question.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>
                  Q{index + 1}: {question.text}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-72">
                {question.type === 'mcq' && chartData[question.id] && (
                  <ChartContainer
                    config={{
                      count: { color: "#FF007F" },
                    }}
                    className="w-full aspect-[4/3]"
                  >
                    <BarChart data={chartData[question.id]}>
                      <XAxis dataKey="option" />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ChartContainer>
                )}
                
                {question.type === 'number' && chartData[question.id] && (
                  <ChartContainer
                    config={{
                      count: { color: "#00DDEB" },
                    }}
                    className="w-full aspect-[4/3]"
                  >
                    <BarChart data={chartData[question.id]}>
                      <XAxis dataKey="range" />
                      <YAxis allowDecimals={false} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" />
                    </BarChart>
                  </ChartContainer>
                )}
                
                {(!chartData[question.id] || chartData[question.id].length === 0) && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
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
