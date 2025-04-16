
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

interface QuizCardProps {
  quiz: {
    id: string;
    name: string;
    shareable_link: string;
    responses: { count: number }[];
  };
  onViewAnalytics: () => void;
}

export const QuizCard = ({ quiz, onViewAnalytics }: QuizCardProps) => {
  const responseCount = quiz.responses.length;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105">
      <CardHeader className="bg-gradient-to-r from-[#FF007F] to-[#00DDEB] text-white">
        <CardTitle className="truncate">{quiz.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Responses</p>
            <p className="text-2xl font-bold">{responseCount}</p>
          </div>
          <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
            responseCount > 9 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {responseCount > 9 ? '10+' : responseCount}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gray-50">
        <Button 
          variant="outline" 
          className="w-full hover:bg-[#FF007F]/10"
          onClick={onViewAnalytics}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
        </Button>
      </CardFooter>
    </Card>
  );
};
