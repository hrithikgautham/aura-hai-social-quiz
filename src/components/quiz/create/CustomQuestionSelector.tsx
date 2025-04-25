
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Question } from "@/types/quiz";

interface CustomQuestionSelectorProps {
  customQuestions: Question[];
  selectedCustomQuestions: string[];
  onToggleQuestion: (id: string) => void;
  showQuestionSelector: boolean;
}

export function CustomQuestionSelector({
  customQuestions,
  selectedCustomQuestions,
  onToggleQuestion,
  showQuestionSelector,
}: CustomQuestionSelectorProps) {
  if (!showQuestionSelector) return null;

  return (
    <>
      {customQuestions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No custom questions available.</p>
      ) : (
        <div className="space-y-4">
          {customQuestions.map((question) => (
            <div key={question.id} className="flex items-center space-x-2 mb-4">
              <Checkbox
                checked={selectedCustomQuestions.includes(question.id)}
                onCheckedChange={() => onToggleQuestion(question.id)}
                id={`q-${question.id}`}
              />
              <label htmlFor={`q-${question.id}`} className="flex-1 cursor-pointer">
                <div className="font-medium">{question.text}</div>
                <div className="text-sm text-gray-500">
                  {question.type === 'mcq' ? 'Multiple Choice' : 'Number'} Question
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
