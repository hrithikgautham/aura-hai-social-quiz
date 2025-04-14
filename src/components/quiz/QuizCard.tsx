
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, BarChart3 } from 'lucide-react';
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

  const handleShareLink = async () => {
    // Use the full URL with the shareable link
    const shareUrl = `${window.location.origin}/quiz/${quiz.shareable_link}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share it with your friends to measure their aura!",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the link manually.",
      });
    }
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
      <CardFooter className="flex justify-between gap-2 p-4 bg-gray-50">
        <Button 
          variant="outline" 
          className="flex-1 hover:bg-[#00DDEB]/10"
          onClick={handleShareLink}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 hover:bg-[#FF007F]/10"
          onClick={onViewAnalytics}
        >
          <BarChart3 className="mr-2 h-4 w-4" /> Analytics
        </Button>
      </CardFooter>
    </Card>
  );
};
