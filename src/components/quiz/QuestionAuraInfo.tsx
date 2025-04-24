
import { Info } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface QuestionAuraInfoProps {
  type: 'mcq' | 'number';
}

export function QuestionAuraInfo({ type }: QuestionAuraInfoProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <Info className="h-4 w-4 mr-1" />
          Aura Points Info
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{type === 'mcq' ? 'Multiple Choice Points' : 'Number Input Points'}</h4>
          <p className="text-sm">
            {type === 'mcq' 
              ? 'Options are weighted based on their position: 1st choice = 4 points, 2nd = 3 points, 3rd = 2 points, 4th = 1 point.'
              : 'Input values between 1-100 directly contribute to your aura points.'}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
