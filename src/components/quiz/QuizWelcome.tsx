
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, BookOpen } from "lucide-react";

interface QuizWelcomeProps {
  quiz: {
    name: string;
    users: {
      username: string;
    };
  };
  onStart: () => void;
}

export const QuizWelcome = ({ quiz, onStart }: QuizWelcomeProps) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Card className="max-w-2xl mx-auto hover:shadow-xl transition-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Welcome to {quiz.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-lg justify-center">
            <Star className="text-[#FFD700]" />
            <span>Created by {quiz.users.username}</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-[#FF007F]" />
              <h3 className="text-xl font-semibold">Quiz Rules</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-gray-600">
              <li>Answer all questions honestly to get accurate results</li>
              <li>Each question contributes to your Aura Points</li>
              <li>Your answers will help measure your aura connection</li>
              <li>You can view the results after completing the quiz</li>
            </ul>
          </div>

          <Button 
            onClick={onStart}
            className="w-full bg-gradient-to-r from-[#FF007F] to-[#00DDEB] text-white hover:opacity-90"
          >
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
