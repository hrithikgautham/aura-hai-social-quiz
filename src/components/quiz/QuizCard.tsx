
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const responseCount = quiz.responses.length;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/quiz/${quiz.shareable_link}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share it with your friends to measure their aura!",
    });
  };

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
      <CardFooter className="p-4 bg-gray-50 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1 hover:bg-[#FF007F]/10"
          onClick={onViewAnalytics}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> View Analytics
        </Button>
        <Button
          variant="outline"
          className="hover:bg-[#00DDEB]/10"
          onClick={handleCopyLink}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
