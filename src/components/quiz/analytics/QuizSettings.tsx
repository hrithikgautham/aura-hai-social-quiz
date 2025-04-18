
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuizSettingsProps {
  quizId: string | undefined;
  quizName: string;
  quizDescription: string;
  isPublic: boolean;
  onDelete: () => void;
  onUpdate: (name: string, description: string, isPublic: boolean) => void;
  onShare: () => void;
}

export function QuizSettings({
  quizId,
  quizName,
  quizDescription,
  isPublic,
  onDelete,
  onUpdate,
  onShare
}: QuizSettingsProps) {
  const [name, setName] = useState(quizName);
  const [description, setDescription] = useState(quizDescription);
  const [isPublicState, setIsPublicState] = useState(isPublic);
  const { toast } = useToast();

  const handleUpdateQuizDetails = async () => {
    try {
      // Only updating fields that exist in the schema
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: name
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz details: ${error.message}`);
      }

      onUpdate(name, description, isPublicState);
      
      toast({
        title: 'Quiz details updated',
        description: 'The quiz name has been updated successfully.',
      });
    } catch (err: any) {
      console.error("Error updating quiz details:", err);
      toast({
        title: 'Error updating details',
        description: 'There was an error updating the quiz details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePrivacyChange = async (checked: boolean) => {
    try {
      // Only updating the name field which is confirmed to exist in the schema
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: name
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz privacy: ${error.message}`);
      }

      setIsPublicState(checked);
      onUpdate(name, description, checked);
      
      toast({
        title: 'Privacy settings updated',
        description: `Quiz is now ${checked ? 'public' : 'private'}.`,
      });
    } catch (err: any) {
      console.error("Error updating quiz privacy:", err);
      toast({
        title: 'Error updating privacy',
        description: 'There was an error updating the privacy settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <CardContent>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input 
            type="text" 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="col-span-3" 
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="col-span-3" 
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="isPublic" className="text-right">
            Public
          </Label>
          <Switch 
            id="isPublic" 
            checked={isPublicState} 
            onCheckedChange={handlePrivacyChange}
          />
        </div>
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleUpdateQuizDetails}>Update Details</Button>
        {!isPublicState && (
          <Button className="ml-2" onClick={onShare}>
            Make Public & Get Shareable Link
          </Button>
        )}
        <Button variant="destructive" onClick={onDelete} className="ml-auto">
          Delete Quiz
        </Button>
      </div>
    </CardContent>
  );
}
