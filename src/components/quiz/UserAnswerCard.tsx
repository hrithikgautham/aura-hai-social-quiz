
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResponseData, QuestionData } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

interface UserAnswerCardProps {
  response: ResponseData;
  questions: QuestionData[];
}

export function UserAnswerCard({ response, questions }: UserAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [username, setUsername] = useState<string>("");
  const formattedDate = new Date(response.created_at).toLocaleDateString();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', response.respondent_id)
          .single();
        
        if (data && !error) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, [response.respondent_id]);

  // Ensure answers is an object, not a string
  const parsedAnswers = typeof response.answers === 'string' 
    ? JSON.parse(response.answers) 
    : response.answers;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm md:text-base">
          Your Response | {formattedDate}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base font-medium">Aura Points: {response.aura_points}</span>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="space-y-3">
            {questions.map((question) => {
              // Simply use the question.id to get the answer, no complex parsing needed
              const answer = parsedAnswers[question.id];
              let displayAnswer = "No answer provided";
              
              if (answer !== undefined) {
                if (question.options && Array.isArray(question.options)) {
                  displayAnswer = question.options[answer] || String(answer);
                } else {
                  displayAnswer = String(answer);
                }
              }
              
              return (
                <div key={question.id} className="border-b pb-2 last:border-b-0">
                  <p className="font-medium text-sm md:text-base">{question.text}</p>
                  <p className="text-sm md:text-base mt-1">
                    <span className="text-gray-500">Answer:</span>{" "}
                    {displayAnswer}
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
