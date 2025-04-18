
// This file needs to import Button and PlusCircle, and define handleShowQuestionSelector

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// Find the "Select custom questions" button and update its responsive styling
// This is a partial update to fix just the button styling

const QuizCreate = ({ handleShowQuestionSelector }) => {
  return (
    <Button
      onClick={handleShowQuestionSelector}
      className="mt-4 mb-6 px-4 py-2 w-full sm:w-auto text-sm md:text-base bg-gradient-to-r from-[#FF007F] to-[#00DDEB]"
    >
      <PlusCircle className="w-4 h-4 mr-2" />
      Select custom questions
    </Button>
  );
};

export default QuizCreate;
