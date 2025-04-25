
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

interface QuizCardProps {
  quiz: {
    id: string;
    name: string;
    shareable_link: string;
    responses?: any[];
  };
  onViewAnalytics?: () => void;
  showCopyLink?: boolean;
  actionButtons?: ReactNode;
}

export const QuizCard = ({ quiz, onViewAnalytics, showCopyLink, actionButtons }: QuizCardProps) => {
  const { toast } = useToast();

  const handleCopyLink = () => {
    const link = `${window.location.origin}/quiz/${quiz.shareable_link}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share it with your friends to measure their aura!",
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{quiz.name}</CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-between pt-4">
        {onViewAnalytics && (
          <Button 
            variant="ghost" 
            onClick={onViewAnalytics}
            className="hover:bg-[#FF007F]/10"
          >
            <BarChart3 className="mr-2 h-4 w-4" /> Summary
          </Button>
        )}
        
        {showCopyLink && (
          <Button
            variant="secondary"
            className="hover:bg-purple-100 hover:text-purple-700 transition-colors"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4 mr-2" /> Copy Link
          </Button>
        )}
        
        {actionButtons}
      </CardFooter>
    </Card>
  );
};
