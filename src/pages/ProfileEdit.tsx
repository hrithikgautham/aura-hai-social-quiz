
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import QuirkyLoading from '@/components/layout/QuirkyLoading';
import { Upload, Camera, Dice3 } from 'lucide-react';

const PLACEHOLDER_IMAGES = [
  'photo-1649972904349-6e44c42644a7',
  'photo-1582562124811-c09040d0a901',
  'photo-1501286353178-1ec871214838',
  'photo-1531297484001-80022131f5a1',
  'photo-1488590528505-98d2b5aba04b',
  'photo-1518770660439-4636190af475',
  'photo-1461749280684-dccba630e2f6',
  'photo-1486312338219-ce68d2c6f44d',
  'photo-1581091226825-a6a2a5aee1b8',
  'photo-1485827404703-89b55fcc595e',
  'photo-1526374965328-7f61d4dc18c5',
  'photo-1487058792275-0ad4aaf24ca7',
  'photo-1605810230434-7631ac76ec81',
  'photo-1473091534298-04dcbce3278c',
  'photo-1519389950473-47ba0277781c',
  'photo-1460925895917-afdab827c52f',
  'photo-1581090464777-f3220bbe1b8b',
  'photo-1498050108023-c5249f4df085',
  'photo-1434494878577-86c23bcb06b9',
  'photo-1534972195531-d756b9bfa9f2'
];

export default function ProfileEdit() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

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
      const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data) {
        // Update the user record with the new avatar URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user?.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          throw updateError;
        }
        
        setAvatarUrl(data.publicUrl);
        
        // Update local storage user data
        if (user) {
          const updatedUser = { ...user, avatar_url: data.publicUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      
      if (user) {
        const updatedUser = { ...user, avatar_url: randomUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
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

  if (loading) {
    return <QuirkyLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FFA99F] to-[#FF719A] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/90">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Edit Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg transition-transform transform hover:scale-105">
                  <AvatarImage src={avatarUrl || user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-2xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full p-2">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 flex-wrap justify-center">
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="avatar-upload"
                    ref={fileInputRef}
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 px-4 py-2 gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Picture"}
                  </Label>
                </div>
                
                <Button 
                  onClick={handleRandomAvatar} 
                  disabled={uploading}
                  className="gap-2"
                >
                  <Dice3 className="w-4 h-4" />
                  Random Picture
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
