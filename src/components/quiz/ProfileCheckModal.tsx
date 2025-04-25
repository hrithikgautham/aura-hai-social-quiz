
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ProfileCheckModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function ProfileCheckModal({ isOpen, onComplete }: ProfileCheckModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setUsername(data.username || '');
        setImageUrl(data.avatar_url || '');
        if (data.username && data.avatar_url) {
          setUserChecked(true);
          onComplete();
        }
      }
    };
    
    checkUserProfile();
  }, [user, onComplete]);

  const handleSave = async () => {
    if (!user) return;
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive",
      });
      return;
    }

    if (!imageUrl && !userChecked) {
      toast({
        title: "Profile picture required",
        description: "Please upload a profile picture to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username,
          avatar_url: imageUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen && !userChecked}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please set up your profile before creating a quiz
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imageUrl} />
              <AvatarFallback>
                {username?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="max-w-[200px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button onClick={handleSave} disabled={isLoading}>
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
