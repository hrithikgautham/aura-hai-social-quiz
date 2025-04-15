import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    if (!quizId || !user) return;

    const fetchQuizData = async () => {
      setLoading(true);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
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
          const formattedQuestions = questionData.map(item => ({
            id: item.id,
            questionId: item.questions.id,
            text: item.questions.text,
            type: item.questions.type as 'mcq' | 'number',
            options: item.questions.options ? JSON.parse(item.questions.options as string) : undefined,
            priority_order: item.priority_order ? JSON.parse(item.priority_order as string) : undefined,
            correct_answer: item.correct_answer,
          }));
          
          setQuestions(formattedQuestions);
        }

        const { data: responseData, error: responseError } = await supabase
          .from('responses')
          .select(`
            id,
            answers,
            aura_points,
            created_at,
            users:respondent_id(username)
          `)
          .eq('quiz_id', quizId);

        if (responseError) throw responseError;
        setResponses(responseData || []);

        if (questionData && responseData) {
          const charts: Record<string, any[]> = {};

          questionData.forEach(question => {
            const questionId = question.id;
            const questionType = question.questions.type;
            
            if (questionType === 'mcq') {
              const options = JSON.parse(question.questions.options);
              const optionCounts = options.reduce((acc: Record<string, number>, opt: string) => {
                acc[opt] = 0;
                return acc;
              }, {});
              
              responseData.forEach(response => {
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
              const values = responseData
                .map(response => {
                  const answer = response.answers[questionId];
                  return answer ? parseInt(answer) : null;
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

  const averageAuraScore = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.aura_points, 0) / responses.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{quiz?.name} Analytics</h1>
            <p className="text-gray-600">View how your friends responded to your aura quiz</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] text-white">
              <CardTitle className="text-center">Total Responses</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold">{responses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#00DDEB] to-[#00FF5E] text-white">
              <CardTitle className="text-center">Average Aura Score</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold">{averageAuraScore.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-gradient-to-r from-[#00FF5E] to-[#FFD700] text-white">
              <CardTitle className="text-center">Highest Score</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="text-5xl font-bold">
                {responses.length > 0
                  ? Math.max(...responses.map(r => r.aura_points)).toLocaleString()
                  : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {responses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">No responses yet</h2>
              <p className="text-gray-500 mb-6">Share your quiz with friends to start collecting responses!</p>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/quiz/${quiz.shareable_link}`);
                  toast({
                    title: "Link copied!",
                    description: "Share it with your friends to measure their aura!",
                  });
                }}
                className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
              >
                Copy Quiz Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
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
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData[question.id]}>
                          <XAxis dataKey="option" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#FF007F" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {question.type === 'number' && chartData[question.id] && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData[question.id]}>
                          <XAxis dataKey="range" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#00DDEB" />
                        </BarChart>
                      </ResponsiveContainer>
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
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Responses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">User</th>
                        <th className="text-left p-2">Aura Points</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .slice(0, 10)
                        .map((response) => (
                          <tr key={response.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{response.users.username}</td>
                            <td className="p-2">{response.aura_points.toLocaleString()}</td>
                            <td className="p-2">
                              {new Date(response.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizAnalytics;
