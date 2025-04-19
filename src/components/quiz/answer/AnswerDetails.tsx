
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { QuestionData } from '@/types/quiz';

interface AnswerDetailsProps {
  questions: QuestionData[];
  answers: any;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AnswerDetails({ questions, answers, isExpanded, onToggle }: AnswerDetailsProps) {
  const parsedAnswers = typeof answers === 'string' 
    ? JSON.parse(answers) 
    : answers;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </Button>
      
      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-3">
            {questions.map((question) => {
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
    </>
  );
}
