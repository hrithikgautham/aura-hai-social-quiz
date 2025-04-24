
import { ChartCard } from '../ChartCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';
import { QuestionData } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const COLORS = ['#FF007F', '#00DDEB', '#FFE29F', '#9b87f5', '#7E69AB', '#D3E4FD'];

interface QuestionAnalysisChartProps {
  questions: QuestionData[];
  selectedQuestionIndex: number;
  setSelectedQuestionIndex: (index: number) => void;
  chartData: any[];
  activeChart: 'bar' | 'pie' | 'area';
  setActiveChart: (chart: 'bar' | 'pie' | 'area') => void;
}

export function QuestionAnalysisChart({
  questions,
  selectedQuestionIndex,
  setSelectedQuestionIndex,
  chartData,
  activeChart,
  setActiveChart
}: QuestionAnalysisChartProps) {
  const currentQuestion = questions[selectedQuestionIndex];
  const { toast } = useToast();
  
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      console.log('QuestionAnalysisChart received chart data:', chartData);
    } else {
      console.log('QuestionAnalysisChart has no chart data');
    }
  }, [chartData]);

  const handleChartTypeChange = (type: 'bar' | 'pie' | 'area') => {
    setActiveChart(type);
    toast({
      title: "Chart type changed",
      description: `Now showing ${type} chart visualization`,
      duration: 1500,
    });
  };

  return (
    <div className="p-4 bg-gradient-to-r from-[#FFE29F]/5 to-[#FF719A]/5 rounded-lg border border-[#FF007F]/10">
      {currentQuestion ? (
        <h3 className="text-sm md:text-base font-medium mb-6 p-3 bg-white/80 rounded-lg border border-[#FF007F]/10 shadow-sm">
          {currentQuestion.text}
          <Badge className="ml-2 bg-[#FF007F]/10 text-[#FF007F] hover:bg-[#FF007F]/20">
            {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Number Input'}
          </Badge>
        </h3>
      ) : (
        <h3 className="text-sm md:text-base font-medium mb-6 p-3 bg-white/80 rounded-lg border border-[#FF007F]/10 shadow-sm">
          No question selected
        </h3>
      )}

      <div className="md:px-4">
        {chartData && chartData.length > 0 ? (
          <div className="h-[400px]">
            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                </PieChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] bg-white/50 rounded-lg border border-dashed border-gray-300 p-6">
            <Activity className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground text-center">No response data available for this question</p>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-[80%]">
              {questions && questions.length > 0 ? 
                "This question has not received any responses yet or the data format doesn't match what's expected" :
                "No questions are available for analysis"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
