
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { ShareDialog } from '@/components/quiz/analytics/ShareDialog';
import { CustomQuestionSelectorCard } from '@/components/quiz/create/CustomQuestionSelectorCard';
import { ArrangeOptionsModal } from '@/components/quiz/create/ArrangeOptionsModal';
import { QuizNameInput } from '@/components/quiz/create/QuizNameInput';
import { useQuizCreate } from '@/hooks/useQuizCreate';

export default function QuizCreatePage() {
  const {
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
  } = useQuizCreate();

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showQuestionSelector, setShowQuestionSelector] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const handleShowQuestionSelector = () => {
    setShowQuestionSelector(!showQuestionSelector);
  };

  // Get only 3 unselected questions for the current step
  const availableQuestions = customQuestions.filter(q => 
    !selectedCustomQuestions.includes(q.id)
  ).slice((currentStep - 1) * 3, currentStep * 3);

  const handleQuestionSelect = (questionId: string) => {
    toggleCustomQuestion(questionId);
    setActiveQuestion(questionId);
  };

  const handlePrioritySet = () => {
    setActiveQuestion(null);
    if (selectedCustomQuestions.length < 3 && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleCreateQuiz().then((success) => {
        if (success) {
          setShowShareDialog(true);
        }
      });
    }
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  return (
    <div
      className="container max-w-3xl py-8 mx-auto"
      style={{ backgroundImage: 'url(/create-quiz-bg.svg)', backgroundSize: 'cover' }}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center mb-2">Create Your Quiz</h1>
      </div>

      <QuizNameInput value={quizName} onChange={setQuizName} />

      <CustomQuestionSelectorCard
        customQuestions={availableQuestions}
        selectedCustomQuestions={selectedCustomQuestions}
        onToggleQuestion={handleQuestionSelect}
        showQuestionSelector={showQuestionSelector}
        handleShowQuestionSelector={handleShowQuestionSelector}
        step={currentStep}
      />

      <ArrangeOptionsModal
        isOpen={!!activeQuestion}
        options={activeQuestion ? answers[activeQuestion] || [] : []}
        onClose={() => setActiveQuestion(null)}
        onArrange={(newOrder) => {
          if (activeQuestion) {
            handleOptionReorder(activeQuestion, newOrder);
            handlePrioritySet();
          }
        }}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onOpenChange={setShowShareDialog}
        shareableLink={createdQuizLink || ''}
      />
    </div>
  );
}
