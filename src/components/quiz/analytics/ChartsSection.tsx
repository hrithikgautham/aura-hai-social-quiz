
import { useState, useMemo } from 'react';
import { ChartCard } from './ChartCard';
import { QuestionBreakdown } from './QuestionBreakdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionData, ResponseData } from '@/types/quiz';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, BarChart, AreaChart, Activity, Users, Calendar } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart as RechartsAreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#FF007F', '#00DDEB', '#FFE29F', '#9b87f5', '#7E69AB', '#D3E4FD'];

interface ChartsSectionProps {
  questions: QuestionData[];
  responses: ResponseData[];
}

export function ChartsSection({ questions, responses }: ChartsSectionProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [activeChart, setActiveChart] = useState<'bar' | 'pie' | 'area'>('bar');
  
  const hasResponses = useMemo(() => responses.length > 0, [responses]);
  const hasQuestions = useMemo(() => questions.length > 0, [questions]);

  // Add a function to calculate average aura points
  const averageAuraPoints = useMemo(() => {
    if (!hasResponses) return 0;
    const total = responses.reduce((sum, response) => sum + (response.aura_points || 0), 0);
    return Math.round(total / responses.length);
  }, [responses, hasResponses]);

  // Calculate completion time trends (average time spent per day)
  const completionTimeTrends = useMemo(() => {
    if (!hasResponses) return [];

    const completionTimeByDate: Record<string, { total: number, count: number }> = {};
    
    responses.forEach(response => {
      if (!response.created_at) return;
      
      const date = new Date(response.created_at).toLocaleDateString();
      const previousValue = completionTimeByDate[date] || { total: 0, count: 0 };
      
      // Calculate time without relying on completion_time property
      // Using created_at as reference point for trends
      completionTimeByDate[date] = {
        total: previousValue.total + 1, // Just count submissions instead of time
        count: previousValue.count + 1
      };
    });

    return Object.entries(completionTimeByDate).map(([date, data]) => ({
      date,
      avgTime: data.total / data.count || 0,
      responses: data.count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [responses, hasResponses]);

  // Process data for selected question
  const questionData = useMemo(() => {
    if (!hasQuestions || !hasResponses || selectedQuestionIndex >= questions.length) {
      return { chartData: [], currentQuestion: null };
    }

    const currentQuestion = questions[selectedQuestionIndex];
    
    // Process responses for the selected question
    const answerCounts: Record<string, number> = {};

    responses.forEach(response => {
      if (!response.answers) return;
      
      const parsedAnswers = typeof response.answers === 'string' 
        ? JSON.parse(response.answers) 
        : response.answers;
      
      const questionAnswer = parsedAnswers[currentQuestion.id];
      if (questionAnswer === undefined) return;
      
      let answerLabel: string;
      
      if (currentQuestion.type === 'mcq' && currentQuestion.options && Array.isArray(currentQuestion.options)) {
        answerLabel = currentQuestion.options[questionAnswer] || String(questionAnswer);
      } else {
        answerLabel = String(questionAnswer);
      }
      
      answerCounts[answerLabel] = (answerCounts[answerLabel] || 0) + 1;
    });

    // Convert to chart data format
    const chartData = Object.entries(answerCounts).map(([name, value]) => ({
      name,
      value,
      responses: value
    }));

    return { chartData, currentQuestion };
  }, [questions, responses, selectedQuestionIndex, hasQuestions, hasResponses]);

  // Calculate participation over time
  const participationData = useMemo(() => {
    if (!hasResponses) return [];
    
    const dataByDate: Record<string, number> = {};
    
    responses.forEach(response => {
      if (!response.created_at) return;
      
      const date = new Date(response.created_at).toLocaleDateString();
      dataByDate[date] = (dataByDate[date] || 0) + 1;
    });

    return Object.entries(dataByDate)
      .map(([date, count]) => ({ date, responses: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [responses, hasResponses]);

  // Calculate daily engagement stats
  const dailyEngagementStats = useMemo(() => {
    if (!hasResponses) return [];
    
    const dateCount: Record<string, number> = {};
    let maxResponses = 0;
    
    responses.forEach(response => {
      if (!response.created_at) return;
      
      const dayOfWeek = new Date(response.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dateCount[dayOfWeek] = (dateCount[dayOfWeek] || 0) + 1;
      maxResponses = Math.max(maxResponses, dateCount[dayOfWeek]);
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return days.map(day => ({
      name: day,
      responses: dateCount[day] || 0,
      fill: (dateCount[day] || 0) === maxResponses ? '#FF007F' : '#00DDEB'
    }));
  }, [responses, hasResponses]);

  // Add a debug log to help diagnose charting issues
  console.log("Question data:", questionData);
  console.log("Selected question:", questions[selectedQuestionIndex]);
  console.log("Response sample:", responses.slice(0, 2)); 

  if (!hasQuestions || !hasResponses) {
    return (
      <ChartCard title="Response Analysis">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">No responses available for analysis yet.</p>
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-[#FFE29F]/20 to-[#FF719A]/20 rounded-full">
            <Activity className="h-12 w-12 text-[#FF007F] opacity-60" />
          </div>
        </div>
      </ChartCard>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-6">
        <ChartCard 
          title="Total Responses" 
          className="bg-gradient-to-br from-[#FFE29F]/5 to-[#FF719A]/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-[#FF007F]">{responses.length}</p>
              <p className="text-sm text-muted-foreground">Unique participants</p>
            </div>
            <div className="p-4 rounded-full bg-[#FFE29F]/20">
              <Users className="h-8 w-8 text-[#FF007F]" />
            </div>
          </div>
        </ChartCard>

        <ChartCard 
          title="Average Aura Score" 
          className="bg-gradient-to-br from-[#00DDEB]/5 to-[#9b87f5]/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-[#00DDEB]">{averageAuraPoints.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Average points per user</p>
            </div>
            <div className="p-4 rounded-full bg-[#00DDEB]/20">
              <Activity className="h-8 w-8 text-[#00DDEB]" />
            </div>
          </div>
        </ChartCard>

        <ChartCard 
          title="Participation Trend" 
          className="bg-gradient-to-br from-[#9b87f5]/5 to-[#7E69AB]/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-[#9b87f5]">
                {participationData.length > 0 ? participationData[participationData.length - 1].responses : 0}
              </p>
              <p className="text-sm text-muted-foreground">Recent daily responses</p>
            </div>
            <div className="p-4 rounded-full bg-[#9b87f5]/20">
              <Calendar className="h-8 w-8 text-[#9b87f5]" />
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard 
        title="Response Analysis" 
        description="Question-by-question breakdown of responses"
      >
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Select
              value={selectedQuestionIndex.toString()}
              onValueChange={(value) => setSelectedQuestionIndex(parseInt(value))}
            >
              <SelectTrigger className="w-full md:w-[300px] border-2 border-[#FF007F]/20 focus:border-[#FF007F] bg-white">
                <SelectValue placeholder="Select a question to analyze" />
              </SelectTrigger>
              <SelectContent>
                {questions.map((question, index) => (
                  <SelectItem key={question.id} value={index.toString()}>
                    Question {index + 1}: {question.text.substring(0, 40)}{question.text.length > 40 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 self-end md:self-auto">
              <Button
                variant={activeChart === 'bar' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChart('bar')}
                className={activeChart === 'bar' ? "bg-[#FF007F] hover:bg-[#FF007F]/90" : ""}
              >
                <BarChart className="h-4 w-4 mr-1" />
                Bar
              </Button>
              <Button
                variant={activeChart === 'pie' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChart('pie')}
                className={activeChart === 'pie' ? "bg-[#00DDEB] hover:bg-[#00DDEB]/90" : ""}
              >
                <PieChart className="h-4 w-4 mr-1" />
                Pie
              </Button>
              <Button
                variant={activeChart === 'area' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveChart('area')}
                className={activeChart === 'area' ? "bg-[#9b87f5] hover:bg-[#9b87f5]/90" : ""}
              >
                <Activity className="h-4 w-4 mr-1" />
                Area
              </Button>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#FFE29F]/5 to-[#FF719A]/5 rounded-lg border border-[#FF007F]/10">
            {questionData.currentQuestion && (
              <h3 className="text-sm md:text-base font-medium mb-6 p-3 bg-white/80 rounded-lg border border-[#FF007F]/10 shadow-sm">
                {questionData.currentQuestion.text}
                <Badge className="ml-2 bg-[#FF007F]/10 text-[#FF007F] hover:bg-[#FF007F]/20">
                  {questionData.currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Number Input'}
                </Badge>
              </h3>
            )}

            <div className="md:px-4">
              {questionData.chartData && questionData.chartData.length > 0 ? (
                <div className="h-[400px]">
                  {activeChart === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={questionData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF007F" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#FF007F" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 0, 127, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="value" name="Responses" fill="url(#barColor)" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'pie' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <defs>
                          {COLORS.map((color, index) => (
                            <linearGradient key={`gradient-${index}`} id={`pieColor${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                              <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={questionData.chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {questionData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`url(#pieColor${index % COLORS.length})`} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 0, 127, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}

                  {activeChart === 'area' && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsAreaChart data={questionData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <defs>
                          <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9b87f5" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#9b87f5" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                            borderRadius: '8px',
                            border: '1px solid rgba(155, 135, 245, 0.2)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="value" name="Responses" stroke="#9b87f5" fillOpacity={1} fill="url(#areaColor)" />
                      </RechartsAreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] bg-white/50 rounded-lg border border-dashed border-gray-300 p-6">
                  <Activity className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-muted-foreground text-center">No response data available for this question</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard 
          title="Participation Timeline" 
          description="Response submissions over time"
        >
          <div className="h-[300px]">
            {participationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart data={participationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="participationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00DDEB" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#00DDEB" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 221, 235, 0.2)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="responses" stroke="#00DDEB" fill="url(#participationGradient)" />
                </RechartsAreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white/50 rounded-lg border border-dashed border-gray-300">
                <Activity className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-muted-foreground">No timeline data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard 
          title="Weekly Response Pattern" 
          description="Responses by day of week"
        >
          <div className="h-[300px]">
            {dailyEngagementStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={dailyEngagementStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '8px',
                      border: '1px solid rgba(155, 135, 245, 0.2)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="responses" fill="#9b87f5" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white/50 rounded-lg border border-dashed border-gray-300">
                <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-muted-foreground">No weekly pattern data available</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
