
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateSequentialLink } from '@/utils/linkGenerator';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { ProfileCheckModal } from '@/components/quiz/ProfileCheckModal';
import { Question } from '@/types/quiz';
import { QuestionList } from '@/components/quiz/create/QuestionList';
import { CustomQuestionSelector } from '@/components/quiz/create/CustomQuestionSelector';
import { ArrangeOptionsModal } from '@/components/quiz/create/ArrangeOptionsModal';
import QuizCreate from '@/components/quiz/QuizCreate';

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [fixedQuestions, setFixedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [hasReadAuraInfo, setHasReadAuraInfo] = useState(false);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data: fixedQuestionsData, error: fixedError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', true)
          .eq('active', true);

        if (fixedError) throw fixedError;

        const processed: Question[] = (fixedQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type as 'mcq' | 'number',
          options: Array.isArray(q.options) ? q.options.map(String) : undefined,
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

        const processedCustom: Question[] = (customQuestionsData || []).map(q => ({
          id: q.id,
          text: q.text,
          type: q.type as 'mcq' | 'number',
          options: Array.isArray(q.options) ? q.options.map(String) : undefined,
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

  const handleShowQuestionSelector = () => {
    setShowQuestionSelector(!showQuestionSelector);
  };

  const toggleCustomQuestion = (id: string) => {
    setSelectedCustomQuestions(prev => 
      prev.includes(id)
        ? prev.filter(qId => qId !== id)
        : [...prev, id]
    );
    
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

  const handleArrangeOptions = (questionId: string) => {
    setActiveQuestion(questionId);
  };

  const handleOptionReorder = (newOrder: string[]) => {
    if (activeQuestion) {
      setAnswers(prev => ({
        ...prev,
        [activeQuestion]: newOrder,
      }));
    }
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  const selectedCustomQuestionsList = customQuestions.filter(q => selectedCustomQuestions.includes(q.id));
  const hasSelectedQuestions = fixedQuestions.length > 0 || selectedCustomQuestions.length > 0;

  return (
    <div className="container max-w-3xl py-8 mx-auto">
      <ProfileCheckModal 
        isOpen={showProfileCheck} 
        onComplete={() => setShowProfileCheck(false)}
      />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Create Your Quiz</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="My Awesome Quiz"
            value={quizName}
            onChange={e => setQuizName(e.target.value)}
            className="mb-6"
          />
        </CardContent>
      </Card>

      <QuestionList
        title="Fixed Questions"
        questions={fixedQuestions}
        onArrangeOptions={handleArrangeOptions}
      />

      <QuestionList
        title="Selected Custom Questions"
        questions={selectedCustomQuestionsList}
        onArrangeOptions={handleArrangeOptions}
        emptyMessage="No custom questions selected."
      />

      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4 mt-4">
            <h3 className="text-xl font-semibold">Custom Questions</h3>
            <QuizCreate handleShowQuestionSelector={handleShowQuestionSelector} />
          </div>

          <CustomQuestionSelector
            customQuestions={customQuestions}
            selectedCustomQuestions={selectedCustomQuestions}
            onToggleQuestion={toggleCustomQuestion}
            showQuestionSelector={showQuestionSelector}
          />
        </CardContent>
      </Card>

      <ArrangeOptionsModal
        isOpen={!!activeQuestion}
        options={activeQuestion ? answers[activeQuestion] || [] : []}
        onClose={() => setActiveQuestion(null)}
        onArrange={handleOptionReorder}
      />

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleCreateQuiz}
          disabled={!quizName.trim() || !hasSelectedQuestions}
          className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
        >
          Create Quiz
        </Button>
      </div>
    </div>
  );
}
