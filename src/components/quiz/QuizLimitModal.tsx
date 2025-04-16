
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Share2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface QuizLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseCount: number;
  requiredResponses: number;
  nextUnlockAt: number;
}

export const QuizLimitModal = ({
  isOpen,
  onClose,
  responseCount,
  requiredResponses,
  nextUnlockAt,
}: QuizLimitModalProps) => {
  const navigate = useNavigate();
  const percentComplete = Math.min(
    (responseCount % requiredResponses) / requiredResponses * 100,
    100
  );

  const remaining = nextUnlockAt - responseCount;

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Quiz limit reached!</DialogTitle>
          <DialogDescription className="text-center">
            Share your existing quizzes to unlock more slots
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="mb-2 text-center">
            {remaining} more responses needed to unlock a new quiz slot
          </p>
          <Progress value={percentComplete} className="h-3" />
          
          <div className="mt-6 text-center text-gray-600">
            <p>For every 10 responses your first 3 quizzes receive, you'll unlock 1 additional quiz slot.</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={goToDashboard}
            variant="outline" 
            className="sm:w-full"
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={onClose}
            className="sm:w-full bg-[#FF007F] hover:bg-[#D6006C]"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Your Quizzes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
