
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        // Toast removed
        console.log('Link copied to clipboard');
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
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
