
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionChart } from './QuestionChart';
import { QuestionBreakdown } from './QuestionBreakdown';
import { QuestionData } from '@/types/quiz';

interface QuestionAnalysisProps {
  questions: QuestionData[];
  selectedQuestionIndex: number;
  setSelectedQuestionIndex: (index: number) => void;
  chartData: Record<string, { name: string; count: number; fill?: string }[]>;
  responses: any[];
}

export function QuestionAnalysis({ 
  questions, 
  selectedQuestionIndex, 
  setSelectedQuestionIndex,
  chartData,
  responses
}: QuestionAnalysisProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Question Analysis</CardTitle>
        <CardDescription className="text-sm md:text-base">Distribution of responses per question</CardDescription>
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

          {questions[selectedQuestionIndex] && (
            <div className="p-2 md:p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm md:text-base font-medium mb-2 break-words">{questions[selectedQuestionIndex].text}</h3>
              <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                <div className="h-48 md:h-64">
                  <QuestionChart 
                    chartData={chartData[questions[selectedQuestionIndex].id] || []}
                    totalResponses={responses.length}
                  />
                </div>
                <div className="mt-4 md:mt-0">
                  <QuestionBreakdown 
                    chartData={chartData[questions[selectedQuestionIndex].id] || []}
                    totalResponses={responses.length}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
