
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuizLimitModal } from '@/components/quiz/QuizLimitModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import { calculateMCQAuraPoints } from "@/utils/auraCalculations";
import { QuestionAuraInfo } from "@/components/quiz/QuestionAuraInfo";
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { generateSequentialLink } from '@/utils/linkGenerator';

// Define types for the questions and steps
type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  options?: string[];
  is_fixed?: boolean;
};

type Step = 'name' | 'question_selection' | 'custom_questions';

// SortableOption component for drag-and-drop functionality
const SortableOption = ({ id, option, index, isDragging }: { id: string, option: string, index: number, isDragging: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center justify-between p-3 mb-2 bg-white border rounded-lg cursor-move",
        isDragging && "opacity-60 border-dashed"
      )}
    >
      <div className="flex items-center">
        <ArrowUpDown className="w-4 h-4 mr-2 text-gray-500" />
        <span>{option}</span>
      </div>
      <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
        #{index + 1}
      </span>
    </div>
  );
};

// Main QuizCreate component
const QuizCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [step, setStep] = useState<Step>('name');
  const [quizName, setQuizName] = useState('');
  const [fixedQuestions, setFixedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasReadAuraInfo, setHasReadAuraInfo] = useState(false);
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: fixedQuestionsData, error: fixedError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', true)
          .eq('active', true);
          
        if (fixedError) throw fixedError;
        
        const { data: customQuestionsData, error: customError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', false)
          .eq('active', true);
          
        if (customError) throw customError;
        
        // Initialize the fixed questions
        const processed = (fixedQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          is_fixed: q.is_fixed
        }));
        
        setFixedQuestions(processed);
        
        // Initialize answers with default order
        const initialAnswers: Record<string, string[]> = {};
        processed.forEach(q => {
          if (q.options) {
            initialAnswers[q.id] = [...q.options];
          }
        });
        
        setAnswers(initialAnswers);
        
        // Process custom questions
        const processedCustom = (customQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options,
          is_fixed: q.is_fixed
        }));
        
        setCustomQuestions(processedCustom);
        
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load questions. Please try again.",
        });
      }
    };
    
    fetchQuestions();
  }, [toast]);
  
  // Handle drag end for the sortable options
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setIsDragging(false);
    
    if (active.id !== over.id && activeQuestion) {
      const oldIndex = answers[activeQuestion].indexOf(active.id);
      const newIndex = answers[activeQuestion].indexOf(over.id);
      
      setAnswers(prev => ({
        ...prev,
        [activeQuestion]: arrayMove(prev[activeQuestion], oldIndex, newIndex),
      }));
    }
  };
  
  // Toggle selection of custom questions
  const toggleCustomQuestion = (id: string) => {
    setSelectedCustomQuestions(prev => 
      prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
    
    // Initialize answers for the custom question if needed
    if (!answers[id] && !selectedCustomQuestions.includes(id)) {
      const question = customQuestions.find(q => q.id === id);
      if (question && question.options) {
        setAnswers(prev => ({
          ...prev,
          [id]: [...question.options]
        }));
      }
    }
  };
  
  // Navigate to the next step
  const handleNextStep = () => {
    if (step === 'name') {
      if (!quizName.trim()) {
        toast({
          variant: "destructive",
          title: "Name Required",
          description: "Please enter a name for your quiz.",
        });
        return;
      }
      setStep('question_selection');
    } else {
      handleCreateQuiz();
    }
  };
  
  // Handle quiz creation
  const handleCreateQuiz = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a quiz.",
      });
      return;
    }

    setLoading(true);
    
    try {
      const shareable_link = generateSequentialLink();

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          name: quizName,
          creator_id: user.id,
          shareable_link: shareable_link,
        })
        .select()
        .single();
      
      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw quizError;
      }

      const allSelectedQuestions = [
        ...fixedQuestions,
        ...customQuestions.filter(q => selectedCustomQuestions.includes(q.id))
      ];

      const quizQuestionsData = allSelectedQuestions.map(question => {
        const priorityOrder = answers[question.id];

        return {
          quiz_id: quizData.id,
          question_id: question.id,
          priority_order: JSON.stringify(priorityOrder),
          correct_answer: null,
        };
      });

      const { error: qError } = await supabase
        .from('quiz_questions')
        .insert(quizQuestionsData);
      
      if (qError) throw qError;

      toast({
        title: "Success!",
        description: "Your quiz has been created successfully!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create quiz. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show question selector for custom questions
  const handleShowQuestionSelector = () => {
    setStep('custom_questions');
  };
  
  // Check if any questions are selected (fixed or custom)
  const hasSelectedQuestions = fixedQuestions.length > 0 || selectedCustomQuestions.length > 0;
  
  if (loading) {
    return <QuirkyLoading />;
  }
  
  return (
    <div className="container max-w-3xl py-8 mx-auto">
      {showLimitModal && (
        <QuizLimitModal onClose={() => setShowLimitModal(false)} />
      )}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          {step === 'name' ? 'Create Your Aura Quiz' : 
           step === 'custom_questions' ? 'Select Custom Questions' : 
           'Arrange Your Questions'}
        </h1>
        <div className="flex justify-center space-x-2 mt-4">
          <div className={`w-3 h-3 rounded-full ${step === 'name' ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${step === 'question_selection' ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
          <div className={`w-3 h-3 rounded-full ${step === 'custom_questions' ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
        </div>
      </div>
      
      {step === 'name' && (
        <Card>
          <CardHeader>
            <CardTitle>Name Your Quiz</CardTitle>
            <CardDescription>
              Give your quiz a name that will attract participants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="My Awesome Aura Quiz"
              value={quizName}
              onChange={e => setQuizName(e.target.value)}
              className="mb-6"
            />
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg border border-purple-100 mb-6">
              <h3 className="text-lg font-semibold mb-2 text-purple-800">How Aura Calculation Works</h3>
              <p className="text-sm mb-3 text-gray-700">
                Each answer choice contributes to a person's aura points differently:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                <li>For ranking questions, the 1st choice gets 4 points, 2nd gets 3 points, and so on.</li>
                <li>For number questions, if the maximum is 5, answering 4 would get 4/5 × 10,000 points = 8,000 points.</li>
                <li>The aura color is determined by the total points across all questions.</li>
              </ul>
              
              <QuestionAuraInfo />
              
              <div className="flex items-center mt-4">
                <Checkbox
                  id="aura-info"
                  checked={hasReadAuraInfo}
                  onCheckedChange={(checked) => setHasReadAuraInfo(checked === true)}
                />
                <label
                  htmlFor="aura-info"
                  className="text-sm font-medium leading-none ml-2 text-gray-700"
                >
                  I understand how aura points are calculated
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={handleNextStep} 
              disabled={!quizName.trim() || !hasReadAuraInfo}
              className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
            >
              Next <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {step === 'question_selection' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fixed Questions</CardTitle>
              <CardDescription>
                These questions will appear in everyone's quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fixedQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No fixed questions available.</p>
              ) : (
                <div className="space-y-4">
                  {fixedQuestions.map(question => (
                    <Card key={question.id} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">{question.text}</CardTitle>
                        <CardDescription>Fixed Question • {question.type === 'mcq' ? 'Multiple Choice' : 'Number'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {question.type === 'mcq' && question.options && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveQuestion(question.id);
                            }}
                            className="w-full justify-between"
                          >
                            <span>Arrange Options</span>
                            <ArrowUpDown className="w-4 h-4 ml-2 text-gray-500" />
                          </Button>
                        )}
                        {question.type === 'number' && (
                          <div className="text-sm text-gray-500">
                            Number input question (1-5)
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Custom Questions</CardTitle>
              <CardDescription>
                Optionally select additional questions for your quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCustomQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No custom questions selected.</p>
              ) : (
                <div className="space-y-4">
                  {customQuestions
                    .filter(q => selectedCustomQuestions.includes(q.id))
                    .map(question => (
                      <Card key={question.id} className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">{question.text}</CardTitle>
                          <CardDescription>Custom Question • {question.type === 'mcq' ? 'Multiple Choice' : 'Number'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {question.type === 'mcq' && question.options && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setActiveQuestion(question.id);
                              }}
                              className="w-full justify-between"
                            >
                              <span>Arrange Options</span>
                              <ArrowUpDown className="w-4 h-4 ml-2 text-gray-500" />
                            </Button>
                          )}
                          {question.type === 'number' && (
                            <div className="text-sm text-gray-500">
                              Number input question (1-5)
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button 
                onClick={handleShowQuestionSelector} 
                className="px-4 py-2 text-sm md:text-base bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
              >
                Select custom questions
              </Button>
            </CardFooter>
          </Card>
          
          <div className="flex justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setStep('name')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button 
              onClick={handleCreateQuiz} 
              disabled={!hasSelectedQuestions}
              className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
            >
              Next <ChevronRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </>
      )}
      
      {step === 'custom_questions' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Available Custom Questions</CardTitle>
              <CardDescription>
                Select additional questions to include in your quiz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No custom questions available.</p>
              ) : (
                <RadioGroup>
                  {customQuestions.map(question => (
                    <div key={question.id} className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        checked={selectedCustomQuestions.includes(question.id)}
                        onCheckedChange={() => toggleCustomQuestion(question.id)}
                        id={`q-${question.id}`}
                      />
                      <Label htmlFor={`q-${question.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{question.text}</div>
                        <div className="text-sm text-gray-500">
                          {question.type === 'mcq' ? 'Multiple Choice' : 'Number'} Question
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => setStep('question_selection')}
                className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
              >
                Done <Check className="ml-1 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
      
      {activeQuestion && answers[activeQuestion] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Arrange Options</CardTitle>
              <CardDescription>
                Drag and drop options to set your preferred order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={answers[activeQuestion]}
                  strategy={verticalListSortingStrategy}
                >
                  {answers[activeQuestion].map((option, index) => (
                    <SortableOption
                      key={option}
                      id={option}
                      option={option}
                      index={index}
                      isDragging={isDragging}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </CardContent>
            <CardFooter className="justify-end">
              <Button 
                onClick={() => setActiveQuestion(null)}
                className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
              >
                Done <Check className="ml-1 w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default QuizCreate;
