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

// ... keep existing code (Question type and Step type)

// ... keep existing code (SortableOption component)

// ... keep existing code (QuizCreate component)

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

// ... keep existing code (rest of the component)
