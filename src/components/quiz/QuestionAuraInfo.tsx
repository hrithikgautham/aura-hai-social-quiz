
import { AlertCircle } from "lucide-react";

interface QuestionAuraInfoProps {
  type: 'mcq' | 'number';
}

export const QuestionAuraInfo = ({ type }: QuestionAuraInfoProps) => {
  return (
    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-[#FFE29F]/10 to-[#FF719A]/10 border border-[#FF007F]/10">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-5 w-5 text-[#FF007F]" />
        <h4 className="font-semibold text-[#FF007F]">Aura Points Calculation</h4>
      </div>
      
      {type === 'mcq' ? (
        <ul className="text-sm space-y-1 list-disc list-inside pl-2">
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF007F] text-white text-xs font-semibold">1</span>
            <span>1st choice (most like you) = <span className="font-semibold">10,000 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF007F]/80 text-white text-xs font-semibold">2</span>
            <span>2nd choice = <span className="font-semibold">7,500 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF007F]/60 text-white text-xs font-semibold">3</span>
            <span>3rd choice = <span className="font-semibold">5,000 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF007F]/40 text-white text-xs font-semibold">4</span>
            <span>4th choice (least like you) = <span className="font-semibold">2,500 points</span></span>
          </li>
        </ul>
      ) : (
        <ul className="text-sm space-y-1 list-disc list-inside pl-2">
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00DDEB] text-white text-xs font-semibold">1</span>
            <span>1-25 = <span className="font-semibold">2,500 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00DDEB]/80 text-white text-xs font-semibold">2</span>
            <span>26-50 = <span className="font-semibold">5,000 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00DDEB]/60 text-white text-xs font-semibold">3</span>
            <span>51-75 = <span className="font-semibold">7,500 points</span></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#00DDEB]/40 text-white text-xs font-semibold">4</span>
            <span>76-100 = <span className="font-semibold">10,000 points</span></span>
          </li>
        </ul>
      )}
    </div>
  );
};
