
import { ChartCard } from './ChartCard';
import { QuestionBreakdown } from './QuestionBreakdown';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionData, ResponseData } from '@/types/quiz';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface ChartsSectionProps {
  questions: QuestionData[];
  responses: ResponseData[];
}

export function ChartsSection({ questions, responses }: ChartsSectionProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  
  if (!questions.length || !responses.length) {
    return (
      <ChartCard title="Response Analysis">
        <p className="text-muted-foreground">No responses available for analysis.</p>
      </ChartCard>
    );
  }

  const currentQuestion = questions[selectedQuestionIndex];
  const questionResponses = responses.map(response => {
    const parsedAnswers = typeof response.answers === 'string' 
      ? JSON.parse(response.answers) 
      : response.answers;
    return parsedAnswers[currentQuestion.id];
  }).filter(answer => answer !== undefined);

  // Process data for question breakdown
  const answerCounts: Record<string, number> = {};
  questionResponses.forEach(answer => {
    const answerText = currentQuestion.options && Array.isArray(currentQuestion.options) && answer < currentQuestion.options.length 
      ? currentQuestion.options[answer] 
      : String(answer);
    answerCounts[answerText] = (answerCounts[answerText] || 0) + 1;
  });

  const chartData = Object.entries(answerCounts).map(([name, value]) => ({
    name,
    responses: value
  }));

  // Calculate participation over time
  const participationData = responses
    .reduce((acc: Record<string, number>, response) => {
      const date = new Date(response.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

  const timelineData = Object.entries(participationData)
    .map(([date, count]) => ({
      date,
      responses: count
    }));

  return (
    <div className="space-y-6">
      <ChartCard 
        title="Response Analysis" 
        description="Question-by-question breakdown of responses"
      >
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

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm md:text-base font-medium mb-4">{currentQuestion.text}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="responses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="responses"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard 
        title="Participation Timeline" 
        description="Response submissions over time"
      >
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="responses" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
