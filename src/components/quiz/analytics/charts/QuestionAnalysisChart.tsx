
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3, PieChart as PieChartIcon, LineChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart } from 'recharts';
import { QuestionData } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      console.log('QuestionAnalysisChart received chart data:', chartData);
    } else {
      console.log('QuestionAnalysisChart has no chart data');
    }
    
    // Set animation flag after a small delay
    setTimeout(() => setAnimate(true), 100);
  }, [chartData]);

  const handleChartTypeChange = (type: 'bar' | 'pie' | 'area') => {
    setActiveChart(type);
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} chart activated`,
      description: `Now showing ${type} chart visualization`,
      duration: 1500,
    });
  };

  // Handle different chart types more gracefully
  const renderChartContent = () => {
    if (chartData && chartData.length > 0) {
      if (activeChart === 'bar') {
        return (
          <ResponsiveContainer width="100%" height="100%" className={cn("transition-opacity duration-500", animate ? "opacity-100" : "opacity-0")}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }} className="animate-enter">
              <defs>
                <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF007F" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#FF007F" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fill: "#6c6c6c", fontSize: 12 }}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis 
                tick={{ fill: "#6c6c6c", fontSize: 12 }}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 0, 127, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }} 
                formatter={(value: any, name: any) => [`${value} responses (${chartData.find(item => item.value === value)?.percentage || 0}%)`, name]}
              />
              <Bar 
                dataKey="value" 
                name="Responses" 
                fill="url(#barColor)" 
                radius={[4, 4, 0, 0]} 
                animationDuration={1500}
                animationBegin={300}
                className="animate-enter"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      
      if (activeChart === 'pie') {
        return (
          <ResponsiveContainer width="100%" height="100%" className={cn("transition-opacity duration-500", animate ? "opacity-100" : "opacity-0")}>
            <PieChart className="animate-enter">
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                animationDuration={1500}
                animationBegin={300}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 0, 127, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: any) => [
                  `${value} responses (${chartData.find(item => item.name === name)?.percentage || 0}%)`, 
                  name
                ]}
              />
              <Legend 
                verticalAlign="bottom"
                layout="horizontal"
                align="center"
                wrapperStyle={{
                  paddingTop: "20px",
                  fontSize: "12px"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      
      if (activeChart === 'area') {
        return (
          <ResponsiveContainer width="100%" height="100%" className={cn("transition-opacity duration-500", animate ? "opacity-100" : "opacity-0")}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }} className="animate-enter">
              <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#9b87f5" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fill: "#6c6c6c", fontSize: 12 }}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <YAxis 
                tick={{ fill: "#6c6c6c", fontSize: 12 }}
                axisLine={{ stroke: "#e0e0e0" }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(155, 135, 245, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }} 
                formatter={(value: any, name: any) => [`${value} responses (${chartData.find(item => item.value === value)?.percentage || 0}%)`, name]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Responses" 
                stroke="#9b87f5" 
                fillOpacity={1} 
                fill="url(#areaColor)" 
                animationDuration={1500}
                animationBegin={300}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      }
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-white/50 rounded-lg border border-dashed border-gray-300 p-6 animate-fade-in">
        <Activity className="h-12 w-12 text-gray-300 mb-3 animate-pulse" />
        <p className="text-muted-foreground text-center font-medium">No response data available for this question</p>
        <p className="text-xs text-muted-foreground mt-2 text-center max-w-[80%]">
          {questions && questions.length > 0 ? 
            "This question has not received any responses yet or the data format doesn't match what's expected" :
            "No questions are available for analysis"}
        </p>
      </div>
    );
  };
  
  return (
    <div className={cn(
      "p-4 bg-gradient-to-r rounded-lg border transition-all duration-300",
      chartData && chartData.length > 0 
        ? "from-[#FFE29F]/5 to-[#FF719A]/5 border-[#FF007F]/10 shadow-md" 
        : "from-gray-50 to-white border-gray-200"
    )}>
      {currentQuestion ? (
        <div className={cn(
          "mb-6 p-3 rounded-lg border transition-all duration-300", 
          animate ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4",
          chartData && chartData.length > 0 
            ? "bg-white/80 border-[#FF007F]/10 shadow-sm" 
            : "bg-gray-50 border-gray-200"
        )}>
          <h3 className="text-sm md:text-base font-medium line-clamp-2">
            {currentQuestion.text}
            <Badge className={cn(
              "ml-2 text-xs transition-colors",
              chartData && chartData.length > 0 
                ? "bg-[#FF007F]/10 text-[#FF007F] hover:bg-[#FF007F]/20" 
                : "bg-gray-200 text-gray-600"
            )}>
              {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Number Input'}
            </Badge>
          </h3>
        </div>
      ) : (
        <div className={cn(
          "mb-6 p-3 rounded-lg border transition-all duration-300", 
          animate ? "opacity-100" : "opacity-0",
          "bg-white/80 border-gray-200"
        )}>
          <h3 className="text-sm md:text-base font-medium text-gray-400">
            No question selected
          </h3>
        </div>
      )}

      <div className="md:px-4">
        <div className={cn(
          "h-[400px] transition-all duration-500",
          animate ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {renderChartContent()}
        </div>
      </div>
      
      <div className={cn(
        "flex justify-center mt-4 gap-2 pt-2",
        animate ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"
      )}>
        <button 
          onClick={() => handleChartTypeChange('bar')} 
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-md transition-all duration-300",
            activeChart === 'bar' 
              ? "bg-[#FF007F] text-white shadow-md" 
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <BarChart3 size={16} />
          <span>Bar</span>
        </button>
        <button 
          onClick={() => handleChartTypeChange('pie')} 
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-md transition-all duration-300",
            activeChart === 'pie' 
              ? "bg-[#00DDEB] text-white shadow-md" 
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <PieChartIcon size={16} />
          <span>Pie</span>
        </button>
        <button 
          onClick={() => handleChartTypeChange('area')} 
          className={cn(
            "flex items-center gap-1 px-4 py-2 rounded-md transition-all duration-300",
            activeChart === 'area' 
              ? "bg-[#9b87f5] text-white shadow-md" 
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          )}
        >
          <LineChart size={16} />
          <span>Area</span>
        </button>
      </div>
    </div>
  );
}
