
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { QuestionData, ResponseData } from '@/types/quiz';
import { useState } from 'react';

interface ChartsSectionProps {
  questions: QuestionData[];
  responses: ResponseData[];
}

export function ChartsSection({ questions, responses }: ChartsSectionProps) {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  
  if (!questions.length || !responses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No responses available for analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[selectedQuestionIndex];
  const questionResponses = responses.map(response => {
    const parsedAnswers = typeof response.answers === 'string' 
      ? JSON.parse(response.answers) 
      : response.answers;
    return parsedAnswers[currentQuestion.id];
  }).filter(answer => answer !== undefined);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Response Analysis</CardTitle>
      </CardHeader>
      <CardContent>
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
            <div className="h-[300px] w-full">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
