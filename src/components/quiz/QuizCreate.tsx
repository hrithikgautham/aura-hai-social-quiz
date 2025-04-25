
// This file contains the QuizCreate component for selecting custom questions

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { QuestionAuraInfo } from "./QuestionAuraInfo";

interface QuizCreateProps {
  handleShowQuestionSelector: () => void;
}

const QuizCreate = ({ handleShowQuestionSelector }: QuizCreateProps) => {
  return (
    <>
      <Button
        onClick={handleShowQuestionSelector}
        className="mt-4 mb-6 px-4 py-2 w-full sm:w-auto text-sm md:text-base bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Select custom questions
      </Button>
    </>
  );
};

export default QuizCreate;
