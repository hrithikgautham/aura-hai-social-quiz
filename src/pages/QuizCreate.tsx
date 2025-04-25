import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { generateSequentialLink } from '@/utils/linkGenerator';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { ProfileCheckModal } from '@/components/quiz/ProfileCheckModal';
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

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  options?: string[];
  is_fixed: boolean;
};

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

const QuizCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'name' | 'question_selection'>('name');
  const [quizName, setQuizName] = useState('');
  const [fixedQuestions, setFixedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [hasReadAuraInfo, setHasReadAuraInfo] = useState(false);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: fixedQuestionsData, error: fixedError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', true)
          .eq('active', true);

        if (fixedError) throw fixedError;

        const processed = (fixedQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type as 'mcq' | 'number',
          options: Array.isArray(q.options) ? q.options : undefined,
          is_fixed: q.is_fixed
        }));

        setFixedQuestions(processed);

        const initialAnswers: Record<string, string[]> = {};
        processed.forEach(q => {
          if (q.options) {
            initialAnswers[q.id] = [...q.options];
          }
        });

        setAnswers(initialAnswers);

        const { data: customQuestionsData, error: customError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', false)
          .eq('active', true);

        if (customError) throw customError;

        const processedCustom = (customQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type as 'mcq' | 'number',
          options: Array.isArray(q.options) ? q.options : undefined,
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

      if (quizError) throw quizError;

      const allSelectedQuestions = [
        ...fixedQuestions,
        ...customQuestions.filter(q => selectedCustomQuestions.includes(q.id))
      ];

      const quizQuestionsData = allSelectedQuestions.map(question => ({
        quiz_id: quizData.id,
        question_id: question.id,
        priority_order: JSON.stringify(answers[question.id] || []),
        correct_answer: null,
      }));

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
      setShowProfileCheck(true);
    } else {
      handleCreateQuiz();
    }
  };

  const handleProfileComplete = () => {
    setProfileComplete(true);
    if (step === 'name') {
      setStep('question_selection');
    }
  };

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

  const hasSelectedQuestions = fixedQuestions.length > 0 || selectedCustomQuestions.length > 0;

  if (loading) {
    return <QuirkyLoading />;
  }

  return (
    <div className="container max-w-3xl py-8 mx-auto">
      <ProfileCheckModal 
        isOpen={showProfileCheck} 
        onComplete={handleProfileComplete}
      />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">
          {step === 'name' ? 'Create Your Quiz' : 'Arrange Your Questions'}
        </h1>
      </div>

      {step === 'name' && (
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="mb-4">Name Your Quiz</CardTitle>
            <CardDescription className="mb-4">
              Give your quiz a name that will attract participants.
            </CardDescription>
            
            <Input
              placeholder="My Awesome Quiz"
              value={quizName}
              onChange={e => setQuizName(e.target.value)}
              className="mb-6"
            />

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg border border-purple-100 mb-6">
              <p className="text-sm mb-3 text-gray-700">
                Understanding Aura Calculation:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                <li>For ranking questions, the 1st choice gets 4 points, 2nd gets 3 points, and so on.</li>
                <li>For number questions on a scale of 1-5: Your answer divided by 5, multiplied by 10,000 points.</li>
                <li>The final aura color is determined by the total points across all questions.</li>
              </ul>
              
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
        </Card>
      )}

      {step === 'question_selection' && (
        <>
          <Card className="mb-6">
            <CardContent>
              {fixedQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No fixed questions available.</p>
              ) : (
                <div className="space-y-4">
                  {fixedQuestions.map(question => (
                    <Card key={question.id} className="border border-gray-200">
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
            <CardContent>
              {selectedCustomQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No custom questions selected.</p>
              ) : (
                <div className="space-y-4">
                  {customQuestions
                    .filter(q => selectedCustomQuestions.includes(q.id))
                    .map(question => (
                      <Card key={question.id} className="border border-gray-200">
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
            <CardContent>
              {customQuestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No custom questions available.</p>
              ) : (
                <div className="space-y-4">
                  {customQuestions.map(question => (
                    <div key={question.id} className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        checked={selectedCustomQuestions.includes(question.id)}
                        onCheckedChange={() => toggleCustomQuestion(question.id)}
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
            </CardContent>
          </Card>
        </>
      )}

      {activeQuestion && answers[activeQuestion] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
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
          </Card>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleNextStep}
          disabled={!quizName.trim() || !hasReadAuraInfo || !hasSelectedQuestions}
          className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
        >
          {step === 'name' ? 'Next' : 'Create Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default QuizCreate;
