
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareableLink: string;
}

export function ShareDialog({ isOpen, onOpenChange, shareableLink }: ShareDialogProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        toast({
          title: 'Link copied!',
          description: 'The shareable link has been copied to your clipboard.',
        });
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          title: 'Error copying link',
          description: 'There was an error copying the link to your clipboard.',
          variant: 'destructive',
        });
      });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Quiz</DialogTitle>
          <DialogDescription>
            Anyone with this link can take the quiz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="link" className="text-right">
              Shareable Link
            </Label>
            <Input type="text" id="link" value={shareableLink} readOnly className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleCopyLink}>
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
