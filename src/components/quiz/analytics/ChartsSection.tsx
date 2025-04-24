
import { useState, useMemo, useEffect } from 'react';
import { ChartCard } from './ChartCard';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, PieChart, Activity } from 'lucide-react';
import { QuestionData, ResponseData } from '@/types/quiz';
import { StatsCards } from './charts/StatsCards';
import { TimelineChart } from './charts/TimelineChart';
import { WeeklyPatternChart } from './charts/WeeklyPatternChart';
import { QuestionAnalysisChart } from './charts/QuestionAnalysisChart';
import { useToast } from '@/hooks/use-toast';

interface ChartsSectionProps {
  questions: QuestionData[];
  responses: ResponseData[];
}

export function ChartsSection({ questions, responses }: ChartsSectionProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [activeChart, setActiveChart] = useState<'bar' | 'pie' | 'area'>('pie');
  const { toast } = useToast();
  
  const hasResponses = useMemo(() => responses && responses.length > 0, [responses]);
  const hasQuestions = useMemo(() => questions && questions.length > 0, [questions]);

  useEffect(() => {
    if (hasResponses && hasQuestions) {
      toast({
        title: "Data loaded",
        description: `Showing analysis for ${responses.length} responses`,
        duration: 2000,
      });
    }
  }, [hasResponses, hasQuestions, responses.length, toast]);

  // Calculate average aura points
  const averageAuraPoints = useMemo(() => {
    if (!hasResponses) return 0;
    const total = responses.reduce((sum, response) => sum + (response.aura_points || 0), 0);
    return Math.round(total / responses.length);
  }, [responses, hasResponses]);

  // Calculate participation data
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

  // Process question data with percentages - Fixed to properly handle answer parsing
  const questionData = useMemo(() => {
    if (!hasQuestions || !hasResponses || selectedQuestionIndex >= questions.length) {
      return { chartData: [], currentQuestion: null };
    }

    console.log('Processing question data, questions:', questions);
    console.log('Selected question index:', selectedQuestionIndex);
    console.log('Responses:', responses);

    const currentQuestion = questions[selectedQuestionIndex];
    console.log('Current question:', currentQuestion);

    const answerCounts: Record<string, number> = {};
    let totalResponses = 0;

    responses.forEach(response => {
      if (!response.answers) {
        console.log('Response has no answers:', response);
        return;
      }
      
      const parsedAnswers = typeof response.answers === 'string' 
        ? JSON.parse(response.answers) 
        : response.answers;
      
      console.log('Parsed answers for response:', parsedAnswers);
      
      // Check if the question ID exists in the answers
      if (parsedAnswers[currentQuestion.id] === undefined) {
        console.log('No answer for question ID:', currentQuestion.id);
        return;
      }
      
      const questionAnswer = parsedAnswers[currentQuestion.id];
      console.log('Found answer:', questionAnswer, 'for question ID:', currentQuestion.id);
      
      let answerLabel: string;
      
      // Handle MCQ questions where the answer is the index of the selected option
      if (currentQuestion.type === 'mcq' && currentQuestion.options && Array.isArray(currentQuestion.options)) {
        // Make sure the answer is within the options array bounds
        if (typeof questionAnswer === 'number' && questionAnswer >= 0 && questionAnswer < currentQuestion.options.length) {
          answerLabel = currentQuestion.options[questionAnswer];
        } else {
          answerLabel = String(questionAnswer);
        }
      } else {
        answerLabel = String(questionAnswer);
      }
      
      console.log('Using answer label:', answerLabel);
      
      answerCounts[answerLabel] = (answerCounts[answerLabel] || 0) + 1;
      totalResponses++;
    });

    console.log('Answer counts:', answerCounts, 'Total responses:', totalResponses);

    const chartData = Object.entries(answerCounts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / totalResponses) * 100)
    }));

    console.log('Generated chart data:', chartData);

    return {
      chartData,
      currentQuestion,
      totalResponses
    };
  }, [questions, responses, selectedQuestionIndex, hasQuestions, hasResponses]);

  const handleChartChange = (chartType: 'bar' | 'pie' | 'area') => {
    setActiveChart(chartType);
    toast({
      title: "Chart type changed",
      description: `Switched to ${chartType} chart view`,
    });
  };

  if (!hasQuestions && !hasResponses) {
    return (
      <ChartCard title="Response Analysis">
        <div className="text-center py-10">
          <p className="text-muted-foreground mb-2">No responses or questions available for analysis yet.</p>
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-[#FFE29F]/20 to-[#FF719A]/20 rounded-full">
            <Activity className="h-12 w-12 text-[#FF007F] opacity-60" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            When participants respond to your quiz, charts and analytics will appear here.
          </p>
        </div>
      </ChartCard>
    );
  }

  return (
    <div className="space-y-8">
      <StatsCards
        totalResponses={responses.length}
        averageAuraPoints={averageAuraPoints}
        recentDailyResponses={participationData.length > 0 ? participationData[participationData.length - 1].responses : 0}
      />

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
                {questions.length > 0 ? 
                  questions.map((question, index) => (
                    <SelectItem key={question.id} value={index.toString()}>
                      Question {index + 1}: {question.text.substring(0, 40)}{question.text.length > 40 ? '...' : ''}
                    </SelectItem>
                  )) : 
                  <SelectItem value="0" disabled>No questions available</SelectItem>
                }
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 self-end md:self-auto">
              <Button
                variant={activeChart === 'bar' ? "default" : "outline"}
                size="sm"
                onClick={() => handleChartChange('bar')}
                className={activeChart === 'bar' ? "bg-[#FF007F] hover:bg-[#FF007F]/90" : ""}
              >
                <BarChart className="h-4 w-4 mr-1" />
                Bar
              </Button>
              <Button
                variant={activeChart === 'pie' ? "default" : "outline"}
                size="sm"
                onClick={() => handleChartChange('pie')}
                className={activeChart === 'pie' ? "bg-[#00DDEB] hover:bg-[#00DDEB]/90" : ""}
              >
                <PieChart className="h-4 w-4 mr-1" />
                Pie
              </Button>
              <Button
                variant={activeChart === 'area' ? "default" : "outline"}
                size="sm"
                onClick={() => handleChartChange('area')}
                className={activeChart === 'area' ? "bg-[#9b87f5] hover:bg-[#9b87f5]/90" : ""}
              >
                <Activity className="h-4 w-4 mr-1" />
                Area
              </Button>
            </div>
          </div>

          <QuestionAnalysisChart
            questions={questions}
            selectedQuestionIndex={selectedQuestionIndex}
            setSelectedQuestionIndex={setSelectedQuestionIndex}
            chartData={questionData.chartData}
            activeChart={activeChart}
            setActiveChart={handleChartChange}
          />
        </div>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <TimelineChart participationData={participationData} />
        <WeeklyPatternChart dailyEngagementStats={dailyEngagementStats} />
      </div>
    </div>
  );
}
