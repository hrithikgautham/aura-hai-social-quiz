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

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  is_fixed: boolean;
  options?: string[];
};

type Step = 'name' | 'fixed' | 'custom' | 'review';

const SortableOption = ({ 
  id, 
  option,
  index 
}: { 
  id: string; 
  option: string;
  index: number;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: transform ? `translateY(${transform.y}px)` : undefined,
    transition,
    cursor: 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes} 
      {...listeners}
      className="flex items-center gap-2 p-3 my-1 bg-white border rounded-lg"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200">
        {index + 1}
      </div>
      <div className="flex-grow">{option}</div>
      <ArrowUpDown size={20} className="text-gray-400" />
    </div>
  );
};

const QuizCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [quizName, setQuizName] = useState('');
  const [fixedQuestions, setFixedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [customQuestionIndex, setCustomQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [configuredCustomQuestions, setConfiguredCustomQuestions] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [hasReadAuraCalculation, setHasReadAuraCalculation] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: fixedData, error: fixedError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', true)
          .eq('active', true);
        
        if (fixedError) throw fixedError;
        
        const { data: customData, error: customError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', false)
          .eq('active', true);
          
        if (customError) throw customError;

        setFixedQuestions(fixedData?.map(q => ({
          ...q,
          type: q.type as 'mcq' | 'number',
          options: q.options ? 
            (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : 
            undefined
        })) || []);
        
        setCustomQuestions(customData?.map(q => ({
          ...q,
          type: q.type as 'mcq' | 'number',
          options: q.options ? 
            (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : 
            undefined
        })) || []);
        
        const initialAnswers: Record<string, any> = {};
        
        fixedData?.forEach(q => {
          if (q.type === 'mcq' && q.options) {
            const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            initialAnswers[q.id] = options;
          } else if (q.type === 'number') {
            initialAnswers[q.id] = '';
          }
        });
        
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load questions. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [toast]);

  useEffect(() => {
    const fetchUserQuizData = async () => {
      if (!user) return;
      
      try {
        const { count: userQuizCount } = await supabase
          .from('quizzes')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', user.id);
          
        setQuizCount(userQuizCount || 0);
        
        if (userQuizCount && userQuizCount >= 3) {
          const { data: responseData } = await supabase
            .rpc('get_first_three_quizzes_response_count', {
              creator_uuid: user.id
            });
            
          setResponseCount(responseData || 0);
          
          const unlockedSlots = Math.floor((responseData || 0) / 10);
          if (userQuizCount >= 3 + unlockedSlots) {
            setShowLimitModal(true);
            setLimitReached(true);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching quiz data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check quiz limits. Please try again.",
        });
      }
      setLoading(false);
    };
    
    fetchUserQuizData();
  }, [user, toast]);

  const isQuestionConfigured = (question: Question): boolean => {
    if (!question) return false;

    if (question.type === 'mcq') {
      return Array.isArray(answers[question.id]) && 
             answers[question.id].length === (question.options?.length || 0);
    }
    
    if (question.type === 'number') {
      const answer = answers[question.id];
      return answer !== '' && !isNaN(Number(answer)) && Number(answer) > 0;
    }
    
    return false;
  };

  const canProceedFromFixed = () => {
    return fixedQuestions.every(q => isQuestionConfigured(q));
  };

  const canProceedFromCustom = () => {
    if (selectedCustomQuestions.length !== 3) return false;
    return selectedCustomQuestions.every(id => {
      const question = customQuestions.find(q => q.id === id);
      return question && isQuestionConfigured(question);
    });
  };

  const handleNextStep = () => {
    if (currentStep === 'name') {
      if (quizName.trim().length < 3 || !hasReadAuraCalculation) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Quiz name must be at least 3 characters long and you must read the aura calculation method.",
        });
        return;
      }
      setCurrentStep('fixed');
    }
    else if (currentStep === 'fixed') {
      if (!canProceedFromFixed()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please answer all fixed questions before proceeding.",
        });
        return;
      }
      setCurrentStep('custom');
    }
    else if (currentStep === 'custom') {
      if (selectedCustomQuestions.length !== 3) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select exactly 3 custom questions.",
        });
        return;
      }
      
      if (!canProceedFromCustom()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please configure all selected custom questions before proceeding.",
        });
        return;
      }
      
      setCurrentStep('review');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'fixed') {
      setCurrentStep('name');
    }
    else if (currentStep === 'custom') {
      setCurrentStep('fixed');
      setCustomQuestionIndex(0);
      setConfiguredCustomQuestions([]);
    }
    else if (currentStep === 'review') {
      setCurrentStep('custom');
    }
  };

  const handleDragEnd = (event: any, questionId: string) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = answers[questionId].indexOf(active.id);
      const newIndex = answers[questionId].indexOf(over.id);
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: arrayMove(prev[questionId], oldIndex, newIndex)
      }));
    }
  };

  const handleCustomQuestionSelect = (checked: boolean, id: string) => {
    if (checked) {
      if (selectedCustomQuestions.length < 3) {
        setSelectedCustomQuestions(prev => [...prev, id]);
        
        const question = customQuestions.find(q => q.id === id);
        if (question) {
          setAnswers(prev => {
            const updated = { ...prev };
            if (question.type === 'mcq' && question.options) {
              updated[id] = Array.isArray(question.options) ? [...question.options] : 
                (typeof question.options === 'string' ? JSON.parse(question.options) : []);
            } else if (question.type === 'number') {
              updated[id] = '';
            }
            return updated;
          });
        }
      } else {
        toast({
          title: "Selection Limit",
          description: "You can only select 3 custom questions.",
          variant: "default",
        });
      }
    } else {
      setSelectedCustomQuestions(prev => prev.filter(qId => qId !== id));
      setConfiguredCustomQuestions(prev => prev.filter(qId => qId !== id));
      
      setAnswers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const navigateFixedQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < fixedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const navigateCustomQuestion = (direction: 'next' | 'prev') => {
    const selectedQuestions = customQuestions.filter(q => selectedCustomQuestions.includes(q.id));
    
    if (direction === 'next' && customQuestionIndex < selectedQuestions.length - 1) {
      const currentQuestionId = selectedQuestions[customQuestionIndex].id;
      if (!configuredCustomQuestions.includes(currentQuestionId)) {
        setConfiguredCustomQuestions(prev => [...prev, currentQuestionId]);
      }
      setCustomQuestionIndex(prev => prev + 1);
    }
    else if (direction === 'prev' && customQuestionIndex > 0) {
      setCustomQuestionIndex(prev => prev - 1);
    }
  };

  const handleNumberChange = (questionId: string, value: string) => {
    const parsedValue = value.replace(/[^0-9]/g, '');
    setAnswers(prev => ({
      ...prev,
      [questionId]: parsedValue
    }));
  };

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
      const shareableLink = crypto.randomUUID();

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          name: quizName,
          creator_id: user.id,
          shareable_link: shareableLink,
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

  const isCustomQuestionConfigured = (questionId: string) => {
    const question = customQuestions.find(q => q.id === questionId);
    if (!question) return false;
    
    if (question.type === 'number') {
      const answer = answers[questionId];
      return answer !== '' && !isNaN(Number(answer)) && Number(answer) > 0;
    }
    if (question.type === 'mcq') {
      return Array.isArray(answers[questionId]) && answers[questionId].length === (question.options?.length || 0);
    }
    return false;
  };

  const handleCompleteCustomQuestionConfig = () => {
    const selectedQuestions = customQuestions.filter(q => selectedCustomQuestions.includes(q.id));
    const currentQuestionId = selectedQuestions[customQuestionIndex].id;
    
    if (!configuredCustomQuestions.includes(currentQuestionId)) {
      setConfiguredCustomQuestions(prev => [...prev, currentQuestionId]);
    }
    
    if (selectedCustomQuestions.length === configuredCustomQuestions.length + 1) {
      setCurrentStep('review');
    } else {
      const nextUnconfiguredIndex = selectedQuestions.findIndex((q, idx) => 
        idx > customQuestionIndex && !configuredCustomQuestions.includes(q.id)
      );
      
      if (nextUnconfiguredIndex !== -1) {
        setCustomQuestionIndex(nextUnconfiguredIndex);
      } else {
        const anyUnconfiguredIndex = selectedQuestions.findIndex((q) => 
          !configuredCustomQuestions.includes(q.id)
        );
        
        if (anyUnconfiguredIndex !== -1) {
          setCustomQuestionIndex(anyUnconfiguredIndex);
        }
      }
    }
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  if (limitReached) {
    return (
      <div 
        className="min-h-screen p-4 md:p-8 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url('/lovable-uploads/4514b60b-b002-4e55-9dcd-d61473f8509f.png')",
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-xl text-center">
            <h1 className="text-2xl md:text-3xl font-bold uppercase text-[#FF007F] mb-4">Quiz Limit Reached</h1>
            <p className="text-lg mb-6">
              You have reached your quiz creation limit. Share your existing quizzes to unlock more slots.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-[#FF007F] hover:bg-[#D6006C]"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <QuizLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          responseCount={responseCount}
          requiredResponses={10}
          nextUnlockAt={Math.ceil((responseCount + 1) / 10) * 10}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{ 
        backgroundImage: "url('/lovable-uploads/4514b60b-b002-4e55-9dcd-d61473f8509f.png')",
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold uppercase text-[#FF007F]">Create Your Quiz</h1>
          
          <div className="flex items-center space-x-2">
            {(['name', 'fixed', 'custom', 'review'] as Step[]).map((step, index) => (
              <div 
                key={step} 
                className={`w-3 h-3 rounded-full ${currentStep === step ? 'bg-[#FF007F]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>

        <Card className="mb-6 backdrop-blur-sm bg-white/90 shadow-xl border-none">
          <CardHeader>
            {currentStep === 'name' && (
              <>
                <CardTitle>Name Your Quiz</CardTitle>
                <CardDescription>Choose a catchy name for your aura quiz</CardDescription>
              </>
            )}

            {currentStep === 'fixed' && (
              <>
                <CardTitle>Core Questions</CardTitle>
                <CardDescription>
                  Answer these questions to set up your quiz ({currentQuestionIndex + 1}/{fixedQuestions.length})
                </CardDescription>
              </>
            )}

            {currentStep === 'custom' && (
              <>
                <CardTitle>Custom Questions</CardTitle>
                <CardDescription>
                  {selectedCustomQuestions.length < 3 
                    ? `Select 3 custom questions for your quiz (${selectedCustomQuestions.length}/3)`
                    : `Configure custom question ${customQuestionIndex + 1} of ${selectedCustomQuestions.length}`}
                </CardDescription>
              </>
            )}
            
            {currentStep === 'review' && (
              <>
                <CardTitle>Review Your Quiz</CardTitle>
                <CardDescription>Make sure everything is correct before creating your quiz</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent>
            {currentStep === 'name' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quizName">Quiz Name</Label>
                  <Input
                    id="quizName"
                    placeholder="Enter your quiz name (min 3 characters)"
                    value={quizName}
                    onChange={e => setQuizName(e.target.value)}
                    className="border-2 focus:border-[#FF007F]"
                  />
                </div>

                <div className="bg-gradient-to-r from-[#FF007F]/10 to-[#00DDEB]/10 p-4 rounded-lg border border-[#FF007F]/20">
                  <h3 className="text-lg font-semibold text-[#FF007F] mb-3">Understanding Aura Calculation</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    In this quiz, your answers will be used to calculate your unique aura points. 
                    Each question is designed to reveal different aspects of your personality and energy.
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    The aura calculation method involves:
                    <ul className="list-disc list-inside ml-2">
                      <li>Analyzing your prioritized answers</li>
                      <li>Assigning weighted points based on your choices</li>
                      <li>Creating a holistic representation of your personal energy</li>
                    </ul>
                  </p>
                  <p className="text-sm text-gray-700 italic">
                    Remember, there are no right or wrong answers - just your authentic self!
                  </p>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="auraCalculationConfirm"
                    checked={hasReadAuraCalculation}
                    onCheckedChange={() => setHasReadAuraCalculation(!hasReadAuraCalculation)}
                  />
                  <Label 
                    htmlFor="auraCalculationConfirm"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and understood the aura calculation method
                  </Label>
                </div>
              </div>
            )}

            {currentStep === 'fixed' && fixedQuestions.length > 0 && (
              <div>
                {fixedQuestions[currentQuestionIndex] && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {fixedQuestions[currentQuestionIndex].text}
                      </h3>
                      <QuestionAuraInfo type={fixedQuestions[currentQuestionIndex].type} />
                    </div>

                    {fixedQuestions[currentQuestionIndex].type === 'mcq' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            Drag options to set their priority (1st is most like you, 4th is least)
                          </p>
                          <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleDragEnd(event, fixedQuestions[currentQuestionIndex].id)}
                            modifiers={[restrictToVerticalAxis]}
                          >
                            <SortableContext 
                              items={answers[fixedQuestions[currentQuestionIndex].id] || []}
                              strategy={verticalListSortingStrategy}
                            >
                              {answers[fixedQuestions[currentQuestionIndex].id]?.map((option: string, index: number) => (
                                <SortableOption 
                                  key={option} 
                                  id={option} 
                                  option={option}
                                  index={index} 
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        </div>
                        <QuestionAuraInfo type="mcq" />
                      </div>
                    )}

                    {fixedQuestions[currentQuestionIndex].type === 'number' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="numberInput">Enter a positive number:</Label>
                          <Input
                            id="numberInput"
                            type="number"
                            min="1"
                            placeholder="Enter a positive number"
                            value={answers[fixedQuestions[currentQuestionIndex].id] || ''}
                            onChange={e => handleNumberChange(
                              fixedQuestions[currentQuestionIndex].id, 
                              e.target.value
                            )}
                            className="border-2 focus:border-[#FF007F]"
                          />
                        </div>
                        <QuestionAuraInfo type="number" />
                      </div>
                    )}

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigateFixedQuestion('prev')}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ChevronLeft size={16} className="mr-2" /> Previous
                      </Button>
                    
                      {currentQuestionIndex < fixedQuestions.length - 1 ? (
                        <Button
                          type="button"
                          onClick={() => navigateFixedQuestion('next')}
                          className="bg-[#00DDEB] hover:bg-[#00BBCC]"
                          disabled={!isQuestionConfigured(fixedQuestions[currentQuestionIndex])}
                        >
                          Next <ChevronRight size={16} className="ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => handleNextStep()}
                          className={cn(
                            "bg-[#FF007F] hover:bg-[#D6006C]",
                            !canProceedFromFixed() && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={!canProceedFromFixed()}
                        >
                          Continue to Custom Questions <ChevronRight size={16} className="ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'custom' && (
              <div className="space-y-4">
                {selectedCustomQuestions.length < 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Select Custom Questions</h3>
                      {customQuestions.map((question, idx) => (
                        <div key={question.id} className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                          <Checkbox
                            id={`question-${idx}`}
                            checked={selectedCustomQuestions.includes(question.id)}
                            onCheckedChange={(checked) => handleCustomQuestionSelect(!!checked, question.id)}
                            className="mt-1"
                            disabled={!selectedCustomQuestions.includes(question.id) && selectedCustomQuestions.length >= 3}
                          />
                          <div className="space-y-1">
                            <Label htmlFor={`question-${idx}`} className="font-medium">
                              {question.text} <span className="text-xs text-gray-500">({question.type})</span>
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedCustomQuestions.length === 3 && (
                      <Button
                        onClick={() => {
                          if (selectedCustomQuestions.length === 3) {
                            setCustomQuestionIndex(0);
                            setCurrentStep('custom');
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Please select exactly 3 custom questions before proceeding.",
                            });
                          }
                        }}
                        className="w-full bg-[#FF007F] hover:bg-[#D6006C]"
                      >
                        Continue to Configure Questions
                      </Button>
                    )}
                  </div>
                )}

                {selectedCustomQuestions.length === 3 && customQuestionIndex >= 0 && (
                  <div className="space-y-6">
                    {(() => {
                      const selectedQuestions = customQuestions.filter(q => 
                        selectedCustomQuestions.includes(q.id)
                      );
                      const currentQuestion = selectedQuestions[customQuestionIndex];
                      
                      if (!currentQuestion) return null;

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">
                              {currentQuestion.text}
                            </h3>
                            <QuestionAuraInfo type={currentQuestion.type} />
                          </div>

                          {currentQuestion.type === 'mcq' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <p className="text-sm text-gray-500">
                                  Drag options to set their priority (1st is most like you, 4th is least)
                                </p>
                                <DndContext 
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={(event) => handleDragEnd(event, currentQuestion.id)}
                                  modifiers={[restrictToVerticalAxis]}
                                >
                                  <SortableContext 
                                    items={answers[currentQuestion.id] || []}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {answers[currentQuestion.id]?.map((option: string, index: number) => (
                                      <SortableOption 
                                        key={option} 
                                        id={option} 
                                        option={option}
                                        index={index} 
                                      />
                                    ))}
                                  </SortableContext>
                                </DndContext>
                              </div>
                              <QuestionAuraInfo type="mcq" />
                            </div>
                          )}

                          {currentQuestion.type === 'number' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`number-${currentQuestion.id}`}>Enter a positive number:</Label>
                                <Input
                                  id={`number-${currentQuestion.id}`}
                                  type="number"
                                  min="1"
                                  placeholder="Enter a positive number"
                                  value={answers[currentQuestion.id] || ''}
                                  onChange={e => handleNumberChange(currentQuestion.id, e.target.value)}
                                  className="border-2 focus:border-[#FF007F]"
                                />
                              </div>
                              <QuestionAuraInfo type="number" />
                            </div>
                          )}

                          <div className="flex justify-between pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => navigateCustomQuestion('prev')}
                              disabled={customQuestionIndex === 0}
                            >
                              <ChevronLeft size={16} className="mr-2" /> Previous
                            </Button>
                          
                            {customQuestionIndex < selectedQuestions.length - 1 ? (
                              <Button
                                type="button"
                                onClick={() => navigateCustomQuestion('next')}
                                className="bg-[#00DDEB] hover:bg-[#00BBCC]"
                                disabled={!isCustomQuestionConfigured(currentQuestion.id)}
                              >
                                Next <ChevronRight size={16} className="ml-2" />
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={handleCompleteCustomQuestionConfig}
                                className={cn(
                                  "bg-[#FF007F] hover:bg-[#D6006C]",
                                  !isCustomQuestionConfigured(currentQuestion.id) && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!isCustomQuestionConfigured(currentQuestion.id)}
                              >
                                Review Quiz <ChevronRight size={16} className="ml-2" />
                              </Button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium">Quiz Name</h3>
                  <p className="text-lg mt-1">{quizName}</p>
                </div>

                <div>
                  <h3 className="font-medium">Fixed Questions ({fixedQuestions.length})</h3>
                  <ul className="mt-2 space-y-2">
                    {fixedQuestions.map(q => (
                      <li key={q.id} className="text-sm">
                        • {q.text} 
                        <span className="ml-2 text-xs text-gray-500">
                          {q.type === 'mcq' ? 
                            `(Priority: ${answers[q.id]?.join(' > ')})` : 
                            `(Answer: ${answers[q.id]})`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium">Custom Questions (3)</h3>
                  <ul className="mt-2 space-y-2">
                    {customQuestions
                      .filter(q => selectedCustomQuestions.includes(q.id))
                      .map(q => (
                        <li key={q.id} className="text-sm">
                          • {q.text}
                          <span className="ml-2 text-xs text-gray-500">
                            {q.type === 'mcq' ? 
                              `(Priority: ${answers[q.id]?.join(' > ')})` : 
                              `(Answer: ${answers[q.id]})`}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            {currentStep !== 'name' && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
              >
                <ChevronLeft size={16} className="mr-2" /> Back
              </Button>
            )}
            
            {currentStep !== 'review' && currentStep !== 'fixed' && currentStep !== 'custom' && (
              <Button
                type="button"
                onClick={handleNextStep}
                className="ml-auto bg-[#FF007F] hover:bg-[#D6006C]"
                disabled={
                  (currentStep === 'name' && (quizName.trim().length < 3 || !hasReadAuraCalculation))
                }
              >
                Next Step <ChevronRight size={16} className="ml-2" />
              </Button>
            )}
            
            {currentStep === 'review' && (
              <Button
                type="button"
                onClick={handleCreateQuiz}
                className="ml-auto bg-[#00DDEB] hover:bg-[#00BBCC]"
              >
                Create Quiz <Check size={16} className="ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <QuizLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        responseCount={responseCount}
        requiredResponses={10}
        nextUnlockAt={Math.ceil((responseCount + 1) / 10) * 10}
      />
    </div>
  );
};

export default QuizCreate;
