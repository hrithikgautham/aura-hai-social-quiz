
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/types/quiz';
import { generateSequentialLink } from '@/utils/linkGenerator';
import { useNavigate } from 'react-router-dom';

interface UseQuizCreateReturn {
  loading: boolean;
  quizName: string;
  setQuizName: (name: string) => void;
  fixedQuestions: Question[];
  customQuestions: Question[];
  selectedCustomQuestions: string[];
  answers: Record<string, string[]>;
  hasReadAuraInfo: boolean;
  setHasReadAuraInfo: (value: boolean) => void;
  handleCreateQuiz: () => Promise<void>;
  toggleCustomQuestion: (id: string) => void;
  handleOptionReorder: (questionId: string, newOrder: string[]) => void;
}

export function useQuizCreate(): UseQuizCreateReturn {
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

  const handleOptionReorder = (questionId: string, newOrder: string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: newOrder,
    }));
  };

  return {
    loading,
    quizName,
    setQuizName,
    fixedQuestions,
    customQuestions,
    selectedCustomQuestions,
    answers,
    hasReadAuraInfo,
    setHasReadAuraInfo,
    handleCreateQuiz,
    toggleCustomQuestion,
    handleOptionReorder,
  };
}
