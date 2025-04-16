
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuraCalculationInfo } from './AuraCalculationInfo';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { CheckCircle2, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  options?: string[];
  priority_order?: string[];
}

interface QuizReviewProps {
  quizName: string;
  questions: QuizQuestion[];
  onEditQuestion: (questionIndex: number) => void;
  onPrevious: () => void;
  onCreateQuiz: () => void;
}

export function QuizReview({ 
  quizName, 
  questions, 
  onEditQuestion,
  onPrevious,
  onCreateQuiz 
}: QuizReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateQuiz = async () => {
    setIsSubmitting(true);
    await onCreateQuiz();
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Review Quiz</h1>
          <p className="text-gray-500">Make sure everything is correct before creating your quiz</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">How points are calculated</span>
          <AuraCalculationInfo />
        </div>
      </div>

      <Card className="border-2 border-[#FF007F]/20">
        <CardHeader className="bg-[#FF007F]/5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{quizName}</CardTitle>
            <Badge variant="secondary" className="bg-[#FF007F]/10 text-[#FF007F]">
              {questions.length} Questions
            </Badge>
          </div>
          <CardDescription>
            Quiz participants will answer these questions to determine their aura
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Accordion type="single" collapsible className="w-full">
            {questions.map((question, index) => {
              const isValid = question.type === 'number' || 
                (question.type === 'mcq' && question.priority_order && question.priority_order.length > 0);
                
              return (
                <AccordionItem value={`question-${index}`} key={index} className="border-b">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00DDEB]/10 text-[#00DDEB] font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-left">{question.text}</span>
                      </div>
                      
                      {isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="capitalize">
                          {question.type === 'mcq' ? 'Multiple Choice' : 'Number Input'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onEditQuestion(index)}
                          className="text-[#FF007F]"
                        >
                          Edit Question
                        </Button>
                      </div>
                      
                      {question.type === 'mcq' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Priority Order:</p>
                          {question.priority_order && question.priority_order.length > 0 ? (
                            <ul className="space-y-2">
                              {question.priority_order.map((option, idx) => (
                                <li key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#FF007F] text-white font-medium text-xs">
                                    {idx + 1}
                                  </span>
                                  <span>{option}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <HelpCircle className="h-4 w-4" />
                              <span className="text-sm">No priority order set</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {question.type === 'number' && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-700">
                            Users will input a number between 1-100
                          </p>
                        </div>  
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button 
          variant="ghost" 
          onClick={onPrevious}
          className="gap-2"
        >
          Go Back
        </Button>
        <Button 
          disabled={isSubmitting || questions.length === 0 || questions.some(q => q.type === 'mcq' && (!q.priority_order || q.priority_order.length === 0))} 
          onClick={handleCreateQuiz}
          className="bg-[#FF007F] hover:bg-[#D6006C] gap-2"
        >
          {isSubmitting ? "Creating Quiz..." : "Create Quiz"} 
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
