
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface QuizNameInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function QuizNameInput({ value, onChange }: QuizNameInputProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <label htmlFor="quiz-name" className="text-sm font-medium text-gray-700">
            Quiz Name
          </label>
        </div>
        <Input
          id="quiz-name"
          placeholder="My Awesome Quiz"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mb-2"
        />
        <p className="text-sm text-gray-500">
          Give your quiz a descriptive name that participants will recognize.
        </p>
      </CardContent>
    </Card>
  );
}
