
import { Button } from '@/components/ui/button';
import { Twitter, Instagram, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  auraPoints: number;
  quizName?: string;
  quizId?: string;
}

export function ShareButtons({ auraPoints, quizName, quizId }: ShareButtonsProps) {
  const { toast } = useToast();

  const getShareUrl = (platform: 'twitter' | 'instagram' | 'linkedin') => {
    if (!quizId) return '#';
    
    const quizUrl = `${window.location.origin}/quiz/${quizId}`;
    const message = `I just scored ${auraPoints} Aura Points on ${quizName || 'a quiz'}! Take it yourself and see your aura: `;
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(quizUrl)}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizUrl)}&title=${encodeURIComponent(message)}`;
      case 'instagram':
        return '#instagram';
      default:
        return '#';
    }
  };
  
  const handleShare = (platform: 'twitter' | 'instagram' | 'linkedin') => {
    const url = getShareUrl(platform);
    
    if (platform === 'instagram') {
      const message = `I just scored ${auraPoints} Aura Points on ${quizName || 'a quiz'}! Take it yourself and see your aura: ${window.location.origin}/quiz/${quizId}`;
      navigator.clipboard.writeText(message);
      
      toast({
        title: "Caption copied!",
        description: "Now open Instagram and paste as your caption with a photo.",
      });
      return;
    }
    
    window.open(url, '_blank');
  };

  return (
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
  );
}
