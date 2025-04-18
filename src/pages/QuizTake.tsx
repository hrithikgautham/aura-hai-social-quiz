import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { QuizLoginForm } from '@/components/auth/QuizLoginForm';
import confetti from 'canvas-confetti';
import { QuizWelcome } from '@/components/quiz/QuizWelcome';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import PageLayout from '@/components/layout/PageLayout';

type QuizQuestion = {
  id: string;
  questionId: string;
  text: string;
  type: 'mcq';
  options?: string[];
  priority_order?: string[];
};

const QuizTake = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [auraPoints, setAuraPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [quizCreator, setQuizCreator] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("Quiz loading timed out after 5 seconds");
        setLoadingTimeout(true);
        setLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*, users:creator_id(username)')
          .or(`id.eq.${quizId},shareable_link.eq.${quizId}`)
          .single();

        if (quizError) throw quizError;
        
        setQuiz(quizData);
        setQuizCreator(quizData.users?.username || null);

        if (user) {
          if (quizData.creator_id === user.id) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You cannot take your own quiz. View analytics instead.",
            });
            navigate(`/quiz/${quizData.id}/analytics`);
            return;
          }

          const { data: responseData, error: responseError } = await supabase
            .from('responses')
            .select('*')
            .eq('quiz_id', quizData.id)
            .eq('respondent_id', user.id)
            .single();

          if (!responseError && responseData) {
            setAuraPoints(responseData.aura_points);
            
            if (responseData.aura_points >= 75000) {
              setTimeout(() => {
                setShowConfetti(true);
              }, 500);
            }
          }

          const { data: questionData, error: questionError } = await supabase
            .from('quiz_questions')
            .select(`
              id,
              priority_order,
              questions:question_id(id, text, type, options)
            `)
            .eq('quiz_id', quizData.id);

          if (questionError) throw questionError;

          if (questionData) {
            setQuestions(questionData.map(item => {
              let parsedOptions;
              if (item.questions.options) {
                if (typeof item.questions.options === 'string') {
                  try {
                    parsedOptions = JSON.parse(item.questions.options);
                  } catch (e) {
                    parsedOptions = item.questions.options.split(',').map(opt => opt.trim());
                    console.warn('Options were not in valid JSON format, falling back to comma-separated parsing', item.questions.options);
                  }
                } else {
                  parsedOptions = item.questions.options;
                }
              }
              
              let parsedPriorityOrder;
              if (item.priority_order) {
                if (typeof item.priority_order === 'string') {
                  try {
                    parsedPriorityOrder = JSON.parse(item.priority_order);
                  } catch (e) {
                    console.error('Failed to parse priority_order', e);
                    parsedPriorityOrder = undefined;
                  }
                } else {
                  parsedPriorityOrder = item.priority_order;
                }
              }

              return {
                id: item.id,
                questionId: item.questions.id,
                text: item.questions.text,
                type: item.questions.type as 'mcq',
                options: parsedOptions,
                priority_order: parsedPriorityOrder,
              };
            }));
            
            const storedAnswers = sessionStorage.getItem(`quiz_answers_${quizData.id}`);
            if (storedAnswers) {
              setAnswers(JSON.parse(storedAnswers));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          variant: "destructive",
          title: "Quiz not found",
          description: "The quiz you're looking for doesn't exist or has been removed.",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, user, navigate, toast]);

  useEffect(() => {
    if (quiz && Object.keys(answers).length > 0) {
      sessionStorage.setItem(`quiz_answers_${quiz.id}`, JSON.stringify(answers));
    }
  }, [answers, quiz]);

  useEffect(() => {
    if (showConfetti) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [showConfetti]);

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
    else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateAuraPoints = () => {
    let totalPoints = 0;

    questions.forEach(question => {
      const answer = answers[question.id];
      
      if (answer && question.priority_order) {
        const position = question.priority_order.indexOf(answer);
        
        const pointsMap = [10000, 7500, 5000, 2500];
        totalPoints += position >= 0 && position < pointsMap.length 
          ? pointsMap[position] 
          : 0;
      }
    });

    return totalPoints;
  };

  const handleSubmit = async () => {
    if (!user || !quiz) return;

    try {
      const points = calculateAuraPoints();
      setAuraPoints(points);
      
      const { error } = await supabase
        .from('responses')
        .insert({
          quiz_id: quiz.id,
          respondent_id: user.id,
          answers: answers,
          aura_points: points
        });

      if (error) throw error;
      
      sessionStorage.removeItem(`quiz_answers_${quiz.id}`);
      
      toast({
        title: "Quiz completed!",
        description: (
          <div className="flex flex-col gap-2">
            <p>Your aura has been measured successfully.</p>
            <Button 
              onClick={() => navigate(`/quiz/${quiz.id}/analytics`)}
              size="sm"
              className="mt-2"
            >
              View Results
            </Button>
          </div>
        ),
        duration: 5000,
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your response. Please try again.",
      });
    }
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  if (loadingTimeout) {
    return (
      <PageLayout className="bg-gradient-to-r from-[#FFE29F] to-[#FF719A]">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Something went wrong
          </h1>
          <p className="text-gray-600 text-center mb-8">
            We couldn't load the quiz. Please try refreshing the page or go back to the dashboard.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#00DDEB] hover:bg-[#00BBCC]"
            >
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-[#FF007F] hover:bg-[#D6006C]"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout className="bg-gradient-to-r from-[#FFE29F] to-[#FF719A]">
        <div className="max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Login Required
          </h1>
          <p className="text-gray-600 text-center mb-8">
            You need to be logged in to take this quiz and measure your aura.
          </p>
          <QuizLoginForm quizCreator={quizCreator || undefined} quizId={quizId} />
        </div>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Quiz Completed!
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-2">{quiz?.name}</h2>
            <p className="text-gray-500 mb-6">Created by {quiz?.users?.username}</p>
            
            <Button
              onClick={() => navigate(`/quiz/${quiz?.id}/analytics`)}
              className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
            >
              View Results
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (showWelcome && quiz) {
    return <QuizWelcome quiz={quiz} onStart={() => setShowWelcome(false)} />;
  }

  return (
    <PageLayout className="bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A]">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{quiz?.name}</h1>
            <p className="text-gray-500">Created by {quiz?.users?.username}</p>
          </div>
          
          <div className="flex items-center mt-2 md:mt-0">
            <div className="text-sm text-gray-500 mr-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
        
        <Progress
          value={(currentQuestionIndex + 1) / questions.length * 100}
          className="h-2 mb-6"
        />
        
        {questions[currentQuestionIndex] && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">{questions[currentQuestionIndex].text}</h2>
            
            <RadioGroup
              value={answers[questions[currentQuestionIndex].id] || ''}
              onValueChange={(value) => 
                handleAnswer(questions[currentQuestionIndex].id, value)
              }
              className="space-y-3"
            >
              {questions[currentQuestionIndex].options?.map((option) => (
                <div key={option} className="flex items-center space-x-2 p-3 border rounded-lg hover:border-[#FF007F] transition-colors">
                  <RadioGroupItem 
                    id={`option-${option}`} 
                    value={option} 
                    className="text-[#FF007F]"
                  />
                  <Label htmlFor={`option-${option}`} className="w-full cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigateQuestion('prev')}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              type="button"
              onClick={() => navigateQuestion('next')}
              className="bg-[#00DDEB] hover:bg-[#00BBCC]"
              disabled={!answers[questions[currentQuestionIndex]?.id]}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-[#FF007F] hover:bg-[#D6006C]"
              disabled={!answers[questions[currentQuestionIndex]?.id]}
            >
              Submit
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default QuizTake;
