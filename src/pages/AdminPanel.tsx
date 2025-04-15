import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  is_fixed: boolean;
  active: boolean;
  options?: string[];
  created_at: string;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fixedQuestions, setFixedQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  
  // Form fields
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'number'>('mcq');
  const [questionOptions, setQuestionOptions] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Get fixed questions
        const { data: fixedData, error: fixedError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', true)
          .order('created_at', { ascending: false });

        if (fixedError) throw fixedError;
        
        // Get custom questions
        const { data: customData, error: customError } = await supabase
          .from('questions')
          .select('*')
          .eq('is_fixed', false)
          .order('created_at', { ascending: false });
          
        if (customError) throw customError;

        // Format questions
        const formattedFixed = fixedData?.map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options as string) : undefined,
          type: q.type as 'mcq' | 'number'
        })) || [];
        
        const formattedCustom = customData?.map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options as string) : undefined,
          type: q.type as 'mcq' | 'number'
        })) || [];
        
        setFixedQuestions(formattedFixed);
        setCustomQuestions(formattedCustom);
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load questions. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [toast]);

  // Count active questions
  const activeFixedCount = fixedQuestions.filter(q => q.active).length;
  const activeCustomCount = customQuestions.filter(q => q.active).length;

  // Edit question
  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionText(question.text);
    setQuestionType(question.type);
    setQuestionOptions(question.options ? question.options.join('\n') : '');
    setIsFixed(question.is_fixed);
    setIsEditing(true);
  };

  // Add new question
  const handleAddQuestion = (isFixedQuestion: boolean) => {
    setSelectedQuestion(null);
    setQuestionText('');
    setQuestionType('mcq');
    setQuestionOptions('');
    setIsFixed(isFixedQuestion);
    setIsAdding(true);
  };

  // Delete question
  const handleDeleteQuestion = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  // Save question (edit or add)
  const handleSaveQuestion = async () => {
    try {
      // Validation
      if (!questionText.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Question text cannot be empty",
        });
        return;
      }

      if (questionType === 'mcq' && (!questionOptions.trim() || questionOptions.split('\n').filter(Boolean).length < 2)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "MCQ questions need at least 2 options",
        });
        return;
      }

      // Check question limits
      if (isAdding) {
        if (isFixed && activeFixedCount >= 7) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "You can only have 7 active fixed questions. Deactivate one before adding a new one.",
          });
          return;
        }

        if (!isFixed && activeCustomCount >= 10) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "You can only have 10 active custom questions. Deactivate one before adding a new one.",
          });
          return;
        }
      }

      // Prepare question data
      const questionData: any = {
        text: questionText.trim(),
        type: questionType,
        is_fixed: isFixed,
        active: true
      };
      
      // Add options if MCQ
      if (questionType === 'mcq') {
        const options = questionOptions
          .split('\n')
          .map(opt => opt.trim())
          .filter(Boolean);
        
        questionData.options = JSON.stringify(options);
      } else {
        questionData.options = null;
      }

      if (isEditing && selectedQuestion) {
        // When editing, deactivate the old question and create a new one
        // Update the old question to inactive
        const { error: updateError } = await supabase
          .from('questions')
          .update({ active: false })
          .eq('id', selectedQuestion.id);

        if (updateError) throw updateError;

        // Insert new question based on the edited one
        const { data: newQuestion, error: insertError } = await supabase
          .from('questions')
          .insert([questionData])
          .select();

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Question updated successfully",
        });
      } else {
        // Insert new question
        const { data: newQuestion, error: insertError } = await supabase
          .from('questions')
          .insert([questionData])
          .select();

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Question added successfully",
        });
      }

      // Refresh questions list
      const { data: fixedData } = await supabase
        .from('questions')
        .select('*')
        .eq('is_fixed', true)
        .order('created_at', { ascending: false });
      
      const { data: customData } = await supabase
        .from('questions')
        .select('*')
        .eq('is_fixed', false)
        .order('created_at', { ascending: false });
      
      // Format questions
      const formattedFixed = fixedData?.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options as string) : undefined,
        type: q.type as 'mcq' | 'number'
      })) || [];
      
      const formattedCustom = customData?.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options as string) : undefined,
        type: q.type as 'mcq' | 'number'
      })) || [];
      
      setFixedQuestions(formattedFixed);
      setCustomQuestions(formattedCustom);

      // Reset form
      setIsEditing(false);
      setIsAdding(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save question. Please try again.",
      });
    }
  };

  // Confirm delete question
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      // Check if there are enough active questions
      const isFixedQuestion = questionToDelete.is_fixed;
      const activeCount = isFixedQuestion ? activeFixedCount : activeCustomCount;
      const requiredCount = isFixedQuestion ? 7 : 10;
      
      if (questionToDelete.active && activeCount <= requiredCount) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `You must maintain exactly ${requiredCount} active ${isFixedQuestion ? 'fixed' : 'custom'} questions. Add a new one before deleting.`,
        });
        setShowDeleteConfirm(false);
        return;
      }

      // Update question to inactive
      const { error } = await supabase
        .from('questions')
        .update({ active: false })
        .eq('id', questionToDelete.id);

      if (error) throw error;

      // Update local state
      if (isFixedQuestion) {
        setFixedQuestions(prev => 
          prev.map(q => q.id === questionToDelete.id ? {...q, active: false} : q)
        );
      } else {
        setCustomQuestions(prev => 
          prev.map(q => q.id === questionToDelete.id ? {...q, active: false} : q)
        );
      }

      toast({
        title: "Success",
        description: "Question deactivated successfully",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate question. Please try again.",
      });
    } finally {
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    }
  };

  // Toggle question active status
  const toggleQuestionStatus = async (question: Question) => {
    try {
      const newStatus = !question.active;
      
      // Check limits before activation
      if (newStatus) {
        const currentActiveCount = question.is_fixed 
          ? activeFixedCount 
          : activeCustomCount;
        const limit = question.is_fixed ? 7 : 10;
        
        if (currentActiveCount >= limit) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `You can only have ${limit} active ${question.is_fixed ? 'fixed' : 'custom'} questions. Deactivate one before activating another.`,
          });
          return;
        }
      } else {
        // Check minimum requirements before deactivation
        const currentActiveCount = question.is_fixed 
          ? activeFixedCount 
          : activeCustomCount;
        const requiredCount = question.is_fixed ? 7 : 10;
        
        if (currentActiveCount <= requiredCount) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `You must maintain at least ${requiredCount} active ${question.is_fixed ? 'fixed' : 'custom'} questions.`,
          });
          return;
        }
      }

      // Update question status
      const { error } = await supabase
        .from('questions')
        .update({ active: newStatus })
        .eq('id', question.id);

      if (error) throw error;

      // Update local state
      if (question.is_fixed) {
        setFixedQuestions(prev => 
          prev.map(q => q.id === question.id ? {...q, active: newStatus} : q)
        );
      } else {
        setCustomQuestions(prev => 
          prev.map(q => q.id === question.id ? {...q, active: newStatus} : q)
        );
      }

      toast({
        title: "Success",
        description: `Question ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling question status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question status. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold uppercase">Admin Panel</h1>
            <p className="text-gray-600">Manage questions for the Aura Hai app</p>
          </div>
        </div>

        <Tabs defaultValue="fixed" className="w-full">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="fixed" className="flex-1">
              Fixed Questions ({activeFixedCount}/7 active)
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">
              Custom Questions ({activeCustomCount}/10 active)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fixed">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fixed Questions</CardTitle>
                  <CardDescription>
                    These 7 questions appear in every quiz. You must always have exactly 7 active fixed questions.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleAddQuestion(true)}
                  disabled={activeFixedCount >= 7}
                  className="bg-[#FF007F] hover:bg-[#D6006C]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Question</th>
                        <th className="text-left p-2 w-24">Type</th>
                        <th className="text-left p-2 w-24">Status</th>
                        <th className="text-left p-2 w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixedQuestions
                        .sort((a, b) => Number(b.active) - Number(a.active))
                        .map((question) => (
                          <tr key={question.id} className={`border-b ${!question.active ? 'text-gray-400' : ''}`}>
                            <td className="p-2">
                              <div className="font-medium">{question.text}</div>
                              {question.type === 'mcq' && question.options && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Options: {question.options.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                question.type === 'mcq' ? 'bg-[#00DDEB]/20 text-[#00DDEB]' : 'bg-[#FFD700]/20 text-[#FFD700]'
                              }`}>
                                {question.type === 'mcq' ? 'Multiple Choice' : 'Number'}
                              </span>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  question.active ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                {question.active ? 'Active' : 'Inactive'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                  className="text-gray-500 hover:text-[#FF007F]"
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="text-gray-500 hover:text-red-500"
                                  disabled={question.active && activeFixedCount <= 7}
                                >
                                  <Trash2 size={16} />
                                </Button>
                                <Switch
                                  checked={question.active}
                                  onCheckedChange={() => toggleQuestionStatus(question)}
                                  disabled={(question.active && activeFixedCount <= 7) || (!question.active && activeFixedCount >= 7)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="custom">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Custom Questions</CardTitle>
                  <CardDescription>
                    Users select 3 from these 10 questions when creating a quiz. You must always have exactly 10 active custom questions.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleAddQuestion(false)}
                  disabled={activeCustomCount >= 10}
                  className="bg-[#FF007F] hover:bg-[#D6006C]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Question</th>
                        <th className="text-left p-2 w-24">Type</th>
                        <th className="text-left p-2 w-24">Status</th>
                        <th className="text-left p-2 w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customQuestions
                        .sort((a, b) => Number(b.active) - Number(a.active))
                        .map((question) => (
                          <tr key={question.id} className={`border-b ${!question.active ? 'text-gray-400' : ''}`}>
                            <td className="p-2">
                              <div className="font-medium">{question.text}</div>
                              {question.type === 'mcq' && question.options && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Options: {question.options.join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                question.type === 'mcq' ? 'bg-[#00DDEB]/20 text-[#00DDEB]' : 'bg-[#FFD700]/20 text-[#FFD700]'
                              }`}>
                                {question.type === 'mcq' ? 'Multiple Choice' : 'Number'}
                              </span>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  question.active ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                {question.active ? 'Active' : 'Inactive'}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditQuestion(question)}
                                  className="text-gray-500 hover:text-[#FF007F]"
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(question)}
                                  className="text-gray-500 hover:text-red-500"
                                  disabled={question.active && activeCustomCount <= 10}
                                >
                                  <Trash2 size={16} />
                                </Button>
                                <Switch
                                  checked={question.active}
                                  onCheckedChange={() => toggleQuestionStatus(question)}
                                  disabled={(question.active && activeCustomCount <= 10) || (!question.active && activeCustomCount >= 10)}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit/Add Question Dialog */}
        <Dialog open={isEditing || isAdding} onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setIsAdding(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Question' : 'Add New Question'}</DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'This will create a new version of the question and mark the old one as inactive.'
                  : 'Add a new question to the question pool.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="questionText">Question Text</Label>
                <Input
                  id="questionText"
                  placeholder="Enter question text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type</Label>
                <Select
                  value={questionType}
                  onValueChange={(value: 'mcq' | 'number') => setQuestionType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {questionType === 'mcq' && (
                <div className="space-y-2">
                  <Label htmlFor="questionOptions">
                    Options (one per line, at least 2 options)
                  </Label>
                  <Textarea
                    id="questionOptions"
                    placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                    value={questionOptions}
                    onChange={(e) => setQuestionOptions(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFixed"
                  checked={isFixed}
                  onCheckedChange={setIsFixed}
                  disabled={isEditing} // Can't change question type when editing
                />
                <Label htmlFor="isFixed">
                  {isFixed ? 'Fixed Question' : 'Custom Question'}
                </Label>
              </div>
            </div>
            
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setIsAdding(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveQuestion}
                className="bg-[#FF007F] hover:bg-[#D6006C]"
              >
                {isEditing ? 'Save Changes' : 'Add Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Deactivate Question</DialogTitle>
              <DialogDescription>
                This will deactivate the question. It won't be shown in new quizzes but will remain in existing ones.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteQuestion}
              >
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;
