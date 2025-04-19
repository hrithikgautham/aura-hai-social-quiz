
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { ResponseData, QuestionData } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ShareButtons } from './ShareButtons';
import { AnswerDetails } from './AnswerDetails';

interface UserAnswerCardProps {
  response: ResponseData;
  questions: QuestionData[];
  quizName?: string;
  quizId?: string;
}

export function UserAnswerCard({ response, questions, quizName, quizId }: UserAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [showShareOptions, setShowShareOptions] = useState(false);
  const { toast } = useToast();
  const formattedDate = new Date(response.created_at).toLocaleDateString();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('id', response.respondent_id)
          .single();
        
        if (data && !error) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };

    fetchUsername();
  }, [response.respondent_id]);

  const copyShareLink = () => {
    if (!quizId) return;
    
    const shareUrl = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied!",
      description: "Share this quiz with your friends.",
    });
  };

  return (
    <Card className="shadow-sm border-2 border-pink-100 hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2 flex flex-row items-center justify-between bg-gradient-to-r from-[#FFE29F]/20 to-[#FF719A]/20 border-b border-pink-100">
        <CardTitle className="text-sm md:text-base">
          Your Response | {formattedDate}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
            Aura Points: {response.aura_points}
          </span>
          <AnswerDetails 
            questions={questions}
            answers={response.answers}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </CardHeader>
      
      <div className={cn(
        "p-3 border-t border-pink-100 transition-all",
        showShareOptions ? "bg-gradient-to-r from-[#FFE29F]/10 to-[#FF719A]/10" : ""
      )}>
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm flex items-center text-pink-700 hover:text-pink-800 hover:bg-pink-50"
              onClick={() => setShowShareOptions(!showShareOptions)}
            >
              {showShareOptions ? "Hide sharing options" : "Share your results"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1 border-pink-200 hover:bg-pink-50"
              onClick={copyShareLink}
            >
              <Copy size={14} />
              Copy Quiz Link
            </Button>
          </div>
          
          {showShareOptions && (
            <ShareButtons
              auraPoints={response.aura_points}
              quizName={quizName}
              quizId={quizId}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
