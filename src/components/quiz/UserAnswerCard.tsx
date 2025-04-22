
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Copy, Twitter, Instagram, Linkedin } from 'lucide-react';
import { ResponseData, QuestionData } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserAnswerCardProps {
  response: ResponseData;
  questions: QuestionData[];
  quizName?: string;
  quizId?: string;
}

export function UserAnswerCard({ response, questions, quizName, quizId }: UserAnswerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [username, setUsername] = useState<string>("");
  const formattedDate = new Date(response.created_at).toLocaleDateString();
  const [showShareOptions, setShowShareOptions] = useState(false);

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

  // Ensure answers is an object, not a string
  const parsedAnswers = typeof response.answers === 'string' 
    ? JSON.parse(response.answers) 
    : response.answers;
    
  const copyShareLink = () => {
    if (!quizId) return;
    
    const shareUrl = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        console.log("Link copied to clipboard");
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
      });
  };

  const getShareUrl = (platform: 'twitter' | 'instagram' | 'linkedin') => {
    if (!quizId) return '#';
    
    const quizUrl = `${window.location.origin}/quiz/${quizId}`;
    const message = `I just scored ${response.aura_points} Aura Points on ${quizName || 'a quiz'}! Take it yourself and see your aura: `;
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(quizUrl)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}&title=${encodeURIComponent(message)}`;
      case 'instagram':
        // Instagram doesn't support direct sharing via URL,
        // so we'll copy to clipboard and provide instructions
        return '#instagram';
      default:
        return '#';
    }
  };
  
  const handleShare = (platform: 'twitter' | 'instagram' | 'linkedin') => {
    const url = getShareUrl(platform);
    
    if (platform === 'instagram') {
      const message = `I just scored ${response.aura_points} Aura Points on ${quizName || 'a quiz'}! Take it yourself and see your aura: ${window.location.origin}/quiz/${quizId}`;
      navigator.clipboard.writeText(message)
        .then(() => {
          console.log("Caption copied for Instagram");
        })
        .catch(err => {
          console.error("Failed to copy caption:", err);
        });
      return;
    }
    
    // On mobile, try to open native app if available
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (platform === 'twitter' && navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
        window.location.href = `twitter://post?message=${encodeURIComponent(`I just scored ${response.aura_points} Aura Points on ${quizName || 'a quiz'}! Take it yourself and see your aura:`)}`;
        setTimeout(() => {
          window.open(url, '_blank');
        }, 500);
        return;
      }
    }
    
    // Default fallback to web URL
    window.open(url, '_blank');
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
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-4">
          <div className="space-y-3">
            {questions.map((question) => {
              // Use the question.id to get the answer
              const answer = parsedAnswers[question.id];
              let displayAnswer = "No answer provided";
              
              if (answer !== undefined) {
                if (question.options && Array.isArray(question.options)) {
                  displayAnswer = question.options[answer] || String(answer);
                } else {
                  displayAnswer = String(answer);
                }
              }
              
              return (
                <div key={question.id} className="border-b pb-2 last:border-b-0">
                  <p className="font-medium text-sm md:text-base">{question.text}</p>
                  <p className="text-sm md:text-base mt-1">
                    <span className="text-gray-500">Answer:</span>{" "}
                    {displayAnswer}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
      
      {/* Share section */}
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
            <div className="flex flex-wrap gap-2 justify-center py-2 animate-fade-in">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30"
                onClick={() => handleShare('twitter')}
              >
                <Twitter size={16} />
                Share on X (Twitter)
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-gradient-to-br from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10 hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#FCAF45]/20 text-[#FD1D1D] border-[#FD1D1D]/30"
                onClick={() => handleShare('instagram')}
              >
                <Instagram size={16} />
                Share on Instagram
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] border-[#0077B5]/30"
                onClick={() => handleShare('linkedin')}
              >
                <Linkedin size={16} />
                Share on LinkedIn
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
