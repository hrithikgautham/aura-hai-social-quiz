
import { AlertCircle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface QuestionAuraInfoProps {
  type: 'mcq' | 'number';
}

export const QuestionAuraInfo = ({ type }: QuestionAuraInfoProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <AlertCircle className="h-5 w-5 text-muted-foreground hover:text-primary cursor-help" />
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold">Aura Points Calculation</h4>
          {type === 'mcq' ? (
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>1st choice (most like you) = 4 points</li>
              <li>2nd choice = 3 points</li>
              <li>3rd choice = 2 points</li>
              <li>4th choice (least like you) = 1 point</li>
            </ul>
          ) : (
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>1-25 = 1 point</li>
              <li>26-50 = 2 points</li>
              <li>51-75 = 3 points</li>
              <li>76-100 = 4 points</li>
            </ul>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
