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
  customQuestions: Question[];
  selectedCustomQuestions: string[];
  answers: Record<string, string[]>;
  handleCreateQuiz: () => Promise<boolean>;
  toggleCustomQuestion: (id: string) => void;
  handleOptionReorder: (questionId: string, newOrder: string[]) => void;
  createdQuizLink: string;
}

export function useQuizCreate(): UseQuizCreateReturn {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [selectedCustomQuestions, setSelectedCustomQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [createdQuizLink, setCreatedQuizLink] = useState<string>('');

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
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
      return false;
    }

    if (!quizName.trim() || selectedCustomQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a quiz name and select questions.",
      });
      return false;
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

      const allSelectedQuestions = customQuestions.filter(q => 
        selectedCustomQuestions.includes(q.id)
      );

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

      setCreatedQuizLink(`${window.location.origin}/quiz/${shareable_link}`);
      
      toast({
        title: "Success!",
        description: "Your quiz has been created successfully!",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create quiz. Please try again.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomQuestion = (id: string) => {
    setSelectedCustomQuestions(prev => [...prev, id]);
    
    const question = customQuestions.find(q => q.id === id);
    if (question && question.options) {
      setAnswers(prev => ({
        ...prev,
        [id]: [...question.options]
      }));
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
    customQuestions,
    selectedCustomQuestions,
    answers,
    handleCreateQuiz,
    toggleCustomQuestion,
    handleOptionReorder,
    createdQuizLink,
  };
}
