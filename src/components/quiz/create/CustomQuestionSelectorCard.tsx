
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Question } from '@/types/quiz';
import { CustomQuestionSelector } from './CustomQuestionSelector';
import QuizCreate from './QuizCreate';

interface CustomQuestionSelectorCardProps {
  customQuestions: Question[];
  selectedCustomQuestions: string[];
  onToggleQuestion: (id: string) => void;
  showQuestionSelector: boolean;
  handleShowQuestionSelector: () => void;
}

export function CustomQuestionSelectorCard({
  customQuestions,
  selectedCustomQuestions,
  onToggleQuestion,
  showQuestionSelector,
  handleShowQuestionSelector,
}: CustomQuestionSelectorCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4 mt-4">
          <h3 className="text-xl font-semibold">Custom Questions</h3>
          <QuizCreate handleShowQuestionSelector={handleShowQuestionSelector} />
        </div>

        <CustomQuestionSelector
          customQuestions={customQuestions}
          selectedCustomQuestions={selectedCustomQuestions}
          onToggleQuestion={onToggleQuestion}
          showQuestionSelector={showQuestionSelector}
        />
      </CardContent>
    </Card>
  );
}
