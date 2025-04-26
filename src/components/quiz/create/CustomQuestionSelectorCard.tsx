
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '@/types/quiz';

interface CustomQuestionSelectorCardProps {
  customQuestions: Question[];
  selectedCustomQuestions: string[];
  onToggleQuestion: (id: string) => void;
  showQuestionSelector: boolean;
  handleShowQuestionSelector: () => void;
  step: number;
}

export function CustomQuestionSelectorCard({
  customQuestions,
  selectedCustomQuestions,
  onToggleQuestion,
  showQuestionSelector,
  step,
}: CustomQuestionSelectorCardProps) {
  if (!showQuestionSelector) return null;

  return (
    <Card>
      <CardContent>
        <div className="space-y-4 mt-4">
          <h3 className="text-xl font-semibold mb-4">Select Question {step}/3</h3>
          
          {customQuestions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {step === 3 ? "You've completed selecting questions!" : "No more questions available."}
            </p>
          ) : (
            <div className="space-y-4">
              {customQuestions.map((question) => (
                <div key={question.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                  <Button
                    onClick={() => onToggleQuestion(question.id)}
                    className="w-full text-left justify-start h-auto py-2"
                    variant="ghost"
                  >
                    <div>
                      <div className="font-medium">{question.text}</div>
                      <div className="text-sm text-gray-500">
                        {question.type === 'mcq' ? 'Multiple Choice' : 'Number'} Question
                      </div>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
