import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResponseData, QuestionData } from '@/types/quiz';

interface UserAnswerCardProps {
  response: ResponseData;
  questions: QuestionData[];
}

export function UserAnswerCard({ response, questions }: UserAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formattedDate = new Date(response.created_at).toLocaleDateString();

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          Response from {response.respondent_id.slice(0, 8)}... | {formattedDate}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Aura Points: {response.aura_points}</span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-3">
            {questions.map((question) => {
              const answer = response.answers[question.id];
              
              return (
                <div key={question.id} className="border-b pb-2 last:border-b-0">
                  <p className="font-medium text-sm">{question.text}</p>
                  <p className="text-sm mt-1">
                    <span className="text-gray-500">Answer:</span>{" "}
                    {question.type === 'mcq' && question.options 
                      ? question.options[answer] 
                      : answer}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
