import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { QuestionForm } from '@/components/admin/QuestionForm';

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  is_fixed: boolean;
  active: boolean;
  options?: string[] | null;
  created_at: string;
};

const formSchema = z.object({
  text: z.string().min(5, "Question must be at least 5 characters"),
  type: z.enum(["mcq", "number"]),
  is_fixed: z.boolean(),
  options: z.array(z.string()).min(2, "Add at least 2 options").optional().nullable(),
});

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fixed' | 'custom'>('fixed');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [newOptions, setNewOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      type: "mcq",
      is_fixed: false,
      options: [],
    },
  });

  useEffect(() => {
    fetchQuestions();
  }, [activeTab]);
  
  const fetchQuestions = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_fixed', activeTab === 'fixed')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Parse options for each question
      const parsedQuestions = data?.map(q => ({
        ...q,
        options: q.options ? 
          (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : 
          null
      })) as Question[];
      
      setQuestions(parsedQuestions || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load questions.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (question: Question) => {
    setSelectedQuestion(question);
    form.reset({
      text: question.text,
      type: question.type,
      is_fixed: question.is_fixed,
      options: question.options || [],
    });
    setNewOptions(question.options || []);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (question: Question) => {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  };
  
  const handleAddOption = () => {
    if (newOptionInput.trim() !== '' && !newOptions.includes(newOptionInput.trim())) {
      setNewOptions([...newOptions, newOptionInput.trim()]);
      setNewOptionInput('');
    }
  };
  
  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...newOptions];
    updatedOptions.splice(index, 1);
    setNewOptions(updatedOptions);
  };
  
  const handleAddQuestion = () => {
    form.reset({
      text: "",
      type: activeTab === 'fixed' ? "mcq" : "mcq",
      is_fixed: activeTab === 'fixed',
      options: [],
    });
    setNewOptions([]);
    setIsAddDialogOpen(true);
  };
  
  const onSubmitAdd = async (values: z.infer<typeof formSchema>) => {
    const activeCount = questions.filter(q => q.active).length;
    const maxAllowed = values.is_fixed ? 7 : 10;
    
    if (activeCount >= maxAllowed) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You can only have ${maxAllowed} active ${values.is_fixed ? 'fixed' : 'custom'} questions.`,
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          text: values.text,
          type: values.type,
          is_fixed: values.is_fixed,
          active: true,
          options: values.type === 'mcq' ? JSON.stringify(newOptions) : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question added successfully.",
      });
      
      setIsAddDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmitEdit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedQuestion) return;
    
    setLoading(true);
    
    try {
      // First, deactivate the old question
      const { error: deactivateError } = await supabase
        .from('questions')
        .update({ active: false })
        .eq('id', selectedQuestion.id);
      
      if (deactivateError) throw deactivateError;
      
      // Then create a new question with the updates
      const { data, error } = await supabase
        .from('questions')
        .insert({
          text: values.text,
          type: values.type,
          is_fixed: values.is_fixed,
          active: true,
          options: values.type === 'mcq' ? JSON.stringify(newOptions) : null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedQuestion) return;
    
    const activeCount = questions.filter(q => q.active).length;
    
    if (activeCount <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: "You must have at least one active question.",
      });
      setIsDeleteDialogOpen(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('questions')
        .update({ active: false })
        .eq('id', selectedQuestion.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question has been deactivated.",
      });
      
      setIsDeleteDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete question.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Make sure only admin users can access this page
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error || !data || !data.is_admin) {
          navigate('/');
        }
      } catch (error) {
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  const handleEditQuestion = async (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setSelectedQuestion({
      id: questionId,
      text: question.text,
      type: question.type,
      options: question.options,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitEdit = async (data: { text: string; type: 'mcq' | 'number'; options?: string[] | undefined; }) => {
    if (!selectedQuestion) return;
    
    setLoading(true);
    
    try {
      // First, deactivate the old question
      const { error: deactivateError } = await supabase
        .from('questions')
        .update({ active: false })
        .eq('id', selectedQuestion.id);
      
      if (deactivateError) throw deactivateError;
      
      // Then create a new question with the updates
      const { data: insertData, error: insertError } = await supabase
        .from('questions')
        .insert({
          text: data.text,
          type: data.type,
          is_fixed: selectedQuestion.is_fixed,
          active: true,
          options: data.type === 'mcq' ? JSON.stringify(data.options) : null,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      toast({
        title: "Success",
        description: "Question updated successfully.",
      });
      
      setIsEditDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update question.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAdd = async (data: { text: string; type: 'mcq' | 'number'; options?: string[] | undefined; }) => {
    setLoading(true);
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('questions')
        .insert({
          text: data.text,
          type: data.type,
          is_fixed: activeTab === 'fixed',
          active: true,
          options: data.type === 'mcq' ? JSON.stringify(data.options) : null,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      toast({
        title: "Success",
        description: "Question added successfully.",
      });
      
      setIsAddDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add question.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF007F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        
        <Tabs defaultValue="fixed" onValueChange={(value) => setActiveTab(value as 'fixed' | 'custom')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="fixed">Fixed Questions ({questions.filter(q => q.is_fixed).length}/7)</TabsTrigger>
              <TabsTrigger value="custom">Custom Questions ({questions.filter(q => !q.is_fixed).length}/10)</TabsTrigger>
            </TabsList>
            
            <Button onClick={handleAddQuestion}>
              Add {activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>
                  {activeTab === 'fixed' 
                    ? 'Fixed questions are asked to all quiz creators' 
                    : 'Custom questions are selected by quiz creators (3 per quiz)'}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="font-medium">{question.text}</TableCell>
                      <TableCell>{question.type === 'mcq' ? 'Multiple Choice' : 'Number'}</TableCell>
                      <TableCell>
                        {question.type === 'mcq' && question.options ? (
                          <div className="flex flex-wrap gap-1">
                            {question.options.map((option, idx) => (
                              <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {option}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(question)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(question)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {questions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No questions found. Add some questions to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </div>
      
      {/* Add question dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add {activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question</DialogTitle>
            <DialogDescription>
              Create a new question for the quiz system.
            </DialogDescription>
          </DialogHeader>
          
          <QuestionForm
            onSubmit={handleSubmitAdd}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit question dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the question. This will create a new version.
            </DialogDescription>
          </DialogHeader>
          <QuestionForm
            initialData={selectedQuestion}
            onSubmit={handleSubmitEdit}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Deactivation
            </DialogTitle>
            <DialogDescription>
              This will mark the question as inactive. It will no longer be available for new quizzes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-3 my-2 bg-gray-50">
            {selectedQuestion?.text}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={loading}
            >
              {loading ? 'Deactivating...' : 'Deactivate Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
