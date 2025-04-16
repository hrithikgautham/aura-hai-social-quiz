
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Link2, Eye, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface QuizCardProps {
  quiz: {
    id: string;
    name: string;
    shareable_link: string;
    responses?: any[];
    users?: {
      username: string;
      avatar_url?: string;
    };
  };
  onViewAnalytics?: () => void;
  onView?: () => void;
  showCreator?: boolean;
  actionButtons?: ReactNode;
}

export const QuizCard = ({ quiz, onViewAnalytics, onView, showCreator, actionButtons }: QuizCardProps) => {
  const { toast } = useToast();
  const responseCount = quiz.responses?.length || 0;

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
        <div className="flex items-center justify-between">
          <CardTitle className="truncate">{quiz.name}</CardTitle>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
            <MessageCircle className="w-4 h-4" />
            <span className="font-semibold">{responseCount}</span>
          </div>
        </div>
        {showCreator && quiz.users && (
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={quiz.users.avatar_url || ''} alt={quiz.users.username} />
              <AvatarFallback>{quiz.users.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="text-sm opacity-80">by {quiz.users.username}</p>
          </div>
        )}
      </CardHeader>
      <CardFooter className="p-4 bg-gray-50 flex gap-2">
        {onViewAnalytics && (
          <Button 
            variant="outline" 
            className="flex-1 hover:bg-[#FF007F]/10"
            onClick={onViewAnalytics}
          >
            <BarChart3 className="mr-2 h-4 w-4" /> Analytics
          </Button>
        )}
        
        {onView && (
          <Button
            variant="outline"
            className="flex-1 hover:bg-[#00DDEB]/10"
            onClick={onView}
          >
            <Eye className="mr-2 h-4 w-4" /> View Results
          </Button>
        )}
        
        {!onView && !actionButtons && (
          <Button
            variant="outline"
            className="hover:bg-[#00DDEB]/10"
            onClick={handleCopyLink}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        )}
        
        {actionButtons}
      </CardFooter>
    </Card>
  );
};
