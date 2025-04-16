
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserAnswerCardProps {
  username: string;
  answers: Record<string, string>;
  auraPoints: number;
  questions: Array<{
    id: string;
    questions: {
      text: string;
      type: string;
    };
  }>;
}

export const UserAnswerCard = ({ username, answers, auraPoints, questions }: UserAnswerCardProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="bg-gradient-to-r from-[#FF007F]/10 to-[#00DDEB]/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{username || 'Anonymous'}</CardTitle>
          <span className="text-sm font-medium bg-[#FF007F] text-white px-3 py-1 rounded-full">
            {auraPoints.toLocaleString()} points
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="border-b pb-2 last:border-b-0">
              <p className="text-sm text-gray-600 mb-1">
                {question.questions?.text || 'Question text unavailable'}
              </p>
              <p className="font-medium">{answers[question.id] || 'No answer'}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
