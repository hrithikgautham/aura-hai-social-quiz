
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { LoginForm } from '@/components/auth/LoginForm';
import confetti from 'canvas-confetti';

// Helper types
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
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch quiz data
  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        // Fetch quiz by id or shareable link
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*, users:creator_id(username)')
          .or(`id.eq.${quizId},shareable_link.eq.${quizId}`)
          .single();

        if (quizError) throw quizError;
        
        setQuiz(quizData);

        // If user is logged in, check if they already responded to this quiz
        if (user) {
          const { data: responseData, error: responseError } = await supabase
            .from('responses')
            .select('*')
            .eq('quiz_id', quizData.id)
            .eq('respondent_id', user.id)
            .single();

          if (!responseError && responseData) {
            setExistingResponse(responseData);
            setAuraPoints(responseData.aura_points);
            
            // Trigger confetti if aura points are high
            if (responseData.aura_points >= 75000) {
              setTimeout(() => {
                setShowConfetti(true);
              }, 500);
            }
          }
        }

        // Fetch quiz questions
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
          // Format questions into a more usable structure
          const formattedQuestions = questionData.map(item => ({
            id: item.id,
            questionId: item.questions.id,
            text: item.questions.text,
            type: item.questions.type as 'mcq',
            options: item.questions.options ? JSON.parse(item.questions.options as string) : undefined,
            priority_order: item.priority_order ? JSON.parse(item.priority_order as string) : undefined,
          }));
          
          setQuestions(formattedQuestions);
          
          // Initialize answers from session storage if available
          const storedAnswers = sessionStorage.getItem(`quiz_answers_${quizData.id}`);
          if (storedAnswers) {
            setAnswers(JSON.parse(storedAnswers));
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

  // Save answers to session storage when they change
  useEffect(() => {
    if (quiz && Object.keys(answers).length > 0) {
      sessionStorage.setItem(`quiz_answers_${quiz.id}`, JSON.stringify(answers));
    }
  }, [answers, quiz]);

  // Trigger confetti effect when showConfetti is true
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

  // Calculate aura points based on answers
  const calculateAuraPoints = () => {
    let totalPoints = 0;

    questions.forEach(question => {
      const answer = answers[question.id];
      
      if (answer && question.priority_order) {
        // Find the position of the selected option in the priority order
        const position = question.priority_order.indexOf(answer);
        
        // Calculate points based on position (10,000 for 1st, 7,500 for 2nd, etc.)
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
      // Calculate aura points
      const points = calculateAuraPoints();
      setAuraPoints(points);
      
      // Save response to database
      const { error } = await supabase
        .from('responses')
        .insert({
          quiz_id: quiz.id,
          respondent_id: user.id,
          answers: answers,
          aura_points: points
        });

      if (error) throw error;

      setSubmitted(true);
      
      // Trigger confetti if aura points are high
      if (points >= 75000) {
        setShowConfetti(true);
      }
      
      // Clear session storage
      sessionStorage.removeItem(`quiz_answers_${quiz.id}`);
      
      toast({
        title: "Quiz completed!",
        description: "Your aura has been measured successfully.",
      });
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
      </div>
    );
  }

  // If not logged in, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold uppercase mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Login to Take the Quiz
          </h1>
          <p className="mb-6 text-gray-600">
            {quiz?.users?.username} wants to measure your aura!
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  // If user already responded to this quiz, show their results
  if (existingResponse) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Your Aura Results
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-2">{quiz.name}</h2>
            <p className="text-gray-500 mb-6">Created by {quiz.users.username}</p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your Aura Points</h3>
              <div className="text-5xl font-bold text-[#FF007F]">
                {auraPoints.toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-4">
              {auraPoints >= 90000 && (
                <div className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] text-white p-4 rounded-lg">
                  <p className="font-bold">LEGENDARY AURA!</p>
                  <p>You share an incredible connection with {quiz.users.username}!</p>
                </div>
              )}
              
              {auraPoints >= 75000 && auraPoints < 90000 && (
                <div className="bg-[#00DDEB] text-white p-4 rounded-lg">
                  <p className="font-bold">AMAZING AURA!</p>
                  <p>You have a great connection with {quiz.users.username}!</p>
                </div>
              )}
              
              {auraPoints >= 50000 && auraPoints < 75000 && (
                <div className="bg-[#00FF5E] text-white p-4 rounded-lg">
                  <p className="font-bold">GOOD AURA!</p>
                  <p>You have a solid connection with {quiz.users.username}.</p>
                </div>
              )}
              
              {auraPoints < 50000 && (
                <div className="bg-[#FFD700] text-white p-4 rounded-lg">
                  <p className="font-bold">DEVELOPING AURA</p>
                  <p>You're still getting to know {quiz.users.username} better.</p>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If quiz is submitted, show results
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold uppercase mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Your Aura Results
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold mb-2">{quiz.name}</h2>
            <p className="text-gray-500 mb-6">Created by {quiz.users.username}</p>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your Aura Points</h3>
              <div className="text-5xl font-bold text-[#FF007F]">
                {auraPoints.toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-4">
              {auraPoints >= 90000 && (
                <div className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] text-white p-4 rounded-lg">
                  <p className="font-bold">LEGENDARY AURA!</p>
                  <p>You share an incredible connection with {quiz.users.username}!</p>
                </div>
              )}
              
              {auraPoints >= 75000 && auraPoints < 90000 && (
                <div className="bg-[#00DDEB] text-white p-4 rounded-lg">
                  <p className="font-bold">AMAZING AURA!</p>
                  <p>You have a great connection with {quiz.users.username}!</p>
                </div>
              )}
              
              {auraPoints >= 50000 && auraPoints < 75000 && (
                <div className="bg-[#00FF5E] text-white p-4 rounded-lg">
                  <p className="font-bold">GOOD AURA!</p>
                  <p>You have a solid connection with {quiz.users.username}.</p>
                </div>
              )}
              
              {auraPoints < 50000 && (
                <div className="bg-[#FFD700] text-white p-4 rounded-lg">
                  <p className="font-bold">DEVELOPING AURA</p>
                  <p>You're still getting to know {quiz.users.username} better.</p>
                </div>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-[#FF007F] hover:bg-[#D6006C] hover:scale-105 transition-transform"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show quiz taking interface
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
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
    </div>
  );
};

export default QuizTake;
