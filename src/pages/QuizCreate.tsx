
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { ProfileCheckModal } from '@/components/quiz/ProfileCheckModal';
import { QuestionList } from '@/components/quiz/create/QuestionList';
import { ArrangeOptionsModal } from '@/components/quiz/create/ArrangeOptionsModal';
import { QuizNameInput } from '@/components/quiz/create/QuizNameInput';
import { CustomQuestionSelectorCard } from '@/components/quiz/create/CustomQuestionSelectorCard';
import { useQuizCreate } from '@/hooks/useQuizCreate';

export default function QuizCreatePage() {
  const {
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
  } = useQuizCreate();

  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  const handleShowQuestionSelector = () => {
    setShowQuestionSelector(!showQuestionSelector);
  };

  const handleArrangeOptions = (questionId: string) => {
    setActiveQuestion(questionId);
  };

  const selectedCustomQuestionsList = customQuestions.filter(q => 
    selectedCustomQuestions.includes(q.id)
  );
  
  const hasSelectedQuestions = fixedQuestions.length > 0 || selectedCustomQuestions.length > 0;

  if (loading) {
    return <QuirkyLoading />;
  }

  return (
    <div className="container max-w-3xl py-8 mx-auto">
      <ProfileCheckModal 
        isOpen={showProfileCheck} 
        onComplete={() => setShowProfileCheck(false)}
      />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Create Your Quiz</h1>
      </div>

      <QuizNameInput value={quizName} onChange={setQuizName} />

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

      <CustomQuestionSelectorCard
        customQuestions={customQuestions}
        selectedCustomQuestions={selectedCustomQuestions}
        onToggleQuestion={toggleCustomQuestion}
        showQuestionSelector={showQuestionSelector}
        handleShowQuestionSelector={handleShowQuestionSelector}
      />

      <ArrangeOptionsModal
        isOpen={!!activeQuestion}
        options={activeQuestion ? answers[activeQuestion] || [] : []}
        onClose={() => setActiveQuestion(null)}
        onArrange={(newOrder) => {
          if (activeQuestion) {
            handleOptionReorder(activeQuestion, newOrder);
          }
        }}
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
