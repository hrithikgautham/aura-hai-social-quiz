
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
import { Upload, Camera, Dice3, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const { user, loading, updateUsername, checkUsernameExists } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
    if (user?.username) {
      setUsername(user.username);
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

  const handleUsernameCheck = async (newUsername: string) => {
    // Skip if username is the same as current
    if (newUsername === user?.username) {
      setUsernameExists(false);
      setUsernameError('');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(newUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const exists = await checkUsernameExists(newUsername);
      setUsernameExists(exists);
      setUsernameError(exists ? 'Username already taken' : '');
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // Debounce username check
    const timeoutId = setTimeout(() => {
      if (newUsername) {
        handleUsernameCheck(newUsername);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  const handleUsernameUpdate = async () => {
    if (username === user?.username) {
      setIsEditingUsername(false);
      return;
    }
    
    if (usernameExists || usernameError || !username) {
      return;
    }
    
    try {
      const success = await updateUsername(username);
      if (success) {
        toast({
          title: "Success",
          description: "Username updated successfully!",
        });
        setIsEditingUsername(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update username.",
        });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update username.",
      });
    }
  };

  if (loading) {
    return <QuirkyLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#FFA99F] to-[#FF719A] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/90 border-2 border-pink-200/50 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="bg-gradient-to-r from-[#FFE29F]/20 to-[#FF719A]/20 border-b-2 border-pink-100 p-6 md:p-8">
            <CardTitle className="text-2xl md:text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
              Edit Your Profile
            </CardTitle>
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-pink-100/50 to-blue-100/50 blur-md"></div>
            <div className="absolute bottom-2 left-10 w-8 h-8 rounded-full bg-gradient-to-br from-blue-100/50 to-purple-100/50 blur-md"></div>
          </CardHeader>
          <CardContent className="space-y-8 p-6 md:p-8 relative">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-lg transition-transform transform group-hover:scale-105">
                  <AvatarImage src={avatarUrl || user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-2xl md:text-4xl">
                    {user?.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 rounded-full p-3 shadow-lg">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -right-4 -bottom-2 w-8 h-8 rounded-full bg-[#FF007F]/20 animate-pulse"></div>
                <div className="absolute -left-3 -top-1 w-6 h-6 rounded-full bg-[#00DDEB]/20 animate-pulse"></div>
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
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 px-4 py-2 gap-2 hover:scale-105 transition-transform"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload Picture"}
                  </Label>
                </div>
                
                <Button 
                  onClick={handleRandomAvatar} 
                  disabled={uploading}
                  className="gap-2 bg-gradient-to-r from-[#FF007F] to-[#FF719A] hover:from-[#FF007F] hover:to-[#FF5A8B] hover:scale-105 transition-transform"
                >
                  <Dice3 className="w-4 h-4" />
                  Random Picture
                </Button>
              </div>
            </div>
            
            <div className="space-y-6 mt-8 relative">
              {/* Decorative background element */}
              <div className="absolute -z-10 inset-0 bg-gradient-to-br from-pink-50/50 to-blue-50/50 rounded-2xl"></div>
              
              <div className="space-y-2 p-4 rounded-xl">
                <Label htmlFor="username" className="text-base md:text-lg font-medium text-pink-800">
                  Username
                </Label>
                
                {isEditingUsername ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        id="username"
                        value={username}
                        onChange={handleUsernameChange}
                        className={`pr-10 text-lg ${
                          username && !isCheckingUsername
                            ? usernameExists || usernameError 
                              ? 'border-red-500 bg-red-50' 
                              : 'border-green-500 bg-green-50'
                            : 'border-pink-200 bg-white'
                        }`}
                        placeholder="Enter new username"
                      />
                      
                      {username && !isCheckingUsername && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameExists || usernameError ? (
                            <div className="bg-red-100 p-1 rounded-full">
                              <X className="w-5 h-5 text-red-500" />
                            </div>
                          ) : (
                            <div className="bg-green-100 p-1 rounded-full">
                              <Check className="w-5 h-5 text-green-500" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {usernameError && (
                      <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">{usernameError}</p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleUsernameUpdate}
                        disabled={usernameExists || !!usernameError || isCheckingUsername || !username || username === user?.username}
                        className="bg-[#00DDEB] hover:bg-[#00BBCC] hover:scale-105 transition-transform"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save Username
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsername(user?.username || '');
                          setUsernameError('');
                        }}
                        className="border-pink-200 hover:bg-pink-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white/80 p-3 rounded-lg border border-pink-100 shadow-sm">
                    <div className="flex-1">
                      <p className="font-medium text-lg text-gray-800">{user?.username || ''}</p>
                      <p className="text-xs text-gray-500">Your unique username across the platform</p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditingUsername(true)}
                      className="bg-white border-pink-200 hover:bg-pink-50 hover:scale-105 transition-transform"
                    >
                      Edit Username
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline"
                className="border-pink-200 text-gray-700 hover:bg-pink-50 hover:scale-105 transition-transform"
              >
                Back to Dashboard
              </Button>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute bottom-4 right-6 w-20 h-20 rounded-full bg-gradient-to-br from-blue-100/20 to-pink-100/20 blur-md"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
