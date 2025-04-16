
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PLACEHOLDER_IMAGES = [
  'photo-1649972904349-6e44c42644a7',
  'photo-1582562124811-c09040d0a901',
  'photo-1501286353178-1ec881214838'
];

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const getRandomPlaceholder = () => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDER_IMAGES.length);
    return `https://images.unsplash.com/${PLACEHOLDER_IMAGES[randomIndex]}?auto=format&fit=crop&w=150&q=80`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Create a path that includes the user's ID as a folder
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user?.id);

        if (updateError) throw updateError;
        
        setAvatarUrl(data.publicUrl);
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile picture.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRandomAvatar = async () => {
    try {
      const randomUrl = getRandomPlaceholder();
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: randomUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(randomUrl);
      toast({
        title: "Success",
        description: "Random profile picture set successfully!",
      });
    } catch (error) {
      console.error('Error setting random avatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set random profile picture.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                <AvatarImage src={avatarUrl || user?.avatar_url} />
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex gap-4">
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 px-4 py-2"
                  >
                    Upload Picture
                  </Label>
                </div>
                
                <Button onClick={handleRandomAvatar}>
                  Use Random Picture
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
