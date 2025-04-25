
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import { Question } from "@/types/quiz";
import { QuestionAuraInfo } from "@/components/quiz/QuestionAuraInfo";

interface QuestionListProps {
  title: string;
  questions: Question[];
  onArrangeOptions: (questionId: string) => void;
  emptyMessage?: string;
}

export function QuestionList({ title, questions, onArrangeOptions, emptyMessage = "No questions available." }: QuestionListProps) {
  return (
    <Card className="mb-6">
      <CardContent>
        <h3 className="text-xl font-semibold mb-4 pt-4">{title}</h3>
        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <Card key={question.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="font-medium mb-3">{question.text}</div>
                  {question.type === 'mcq' && question.options && (
                    <Button
                      variant="outline"
                      onClick={() => onArrangeOptions(question.id)}
                      className="w-full justify-between mb-4"
                    >
                      <span>Arrange Options</span>
                      <ArrowUpDown className="w-4 h-4 ml-2 text-gray-500" />
                    </Button>
                  )}
                  {question.type === 'number' && (
                    <div className="text-sm text-gray-500 mb-4">
                      Number input question (1-5)
                    </div>
                  )}
                  <QuestionAuraInfo type={question.type} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
