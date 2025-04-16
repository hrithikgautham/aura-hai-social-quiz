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
} from '@/components/ui/dialog';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuestionForm } from '@/components/admin/QuestionForm';

type Question = {
  id: string;
  text: string;
  is_fixed: boolean;
  active: boolean;
  options?: string[];
  created_at: string;
};

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
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);

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
    setIsEditDialogOpen(true);
  };

  const handleDelete = (question: Question) => {
    setSelectedQuestion(question);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async (data: { text: string; options: string[] }) => {
    const maxQuestions = activeTab === 'fixed' ? 7 : 10;
    const activeCount = questions.filter(q => q.active).length;

    if (activeCount >= maxQuestions) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You can only have ${maxQuestions} active ${activeTab} questions.`,
      });
      return;
    }

    setLoading(true);
    try {
      const { data: insertData, error } = await supabase
        .from('questions')
        .insert({
          text: data.text,
          type: 'mcq',
          is_fixed: activeTab === 'fixed',
          active: true,
          options: JSON.stringify(data.options),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question added successfully.",
      });

      setIsAddDialogOpen(false);
      setShowAddPrompt(false);
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

  const handleSubmitEdit = async (data: { text: string; options: string[] }) => {
    if (!selectedQuestion) return;

    setLoading(true);
    try {
      const { error: deactivateError } = await supabase
        .from('questions')
        .update({ active: false })
        .eq('id', selectedQuestion.id);

      if (deactivateError) throw deactivateError;

      const { error } = await supabase
        .from('questions')
        .insert({
          text: data.text,
          type: 'mcq',
          is_fixed: selectedQuestion.is_fixed,
          active: true,
          options: JSON.stringify(data.options),
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
    const minRequired = selectedQuestion.is_fixed ? 7 : 10;

    if (activeCount <= minRequired) {
      setIsDeleteDialogOpen(false);
      setShowAddPrompt(true);
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

      // Show add prompt if we're at the minimum required questions
      if (activeCount - 1 <= minRequired) {
        setShowAddPrompt(true);
      }
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
        <h1 className="text-3xl font-bold mb-6">Question Management</h1>
        
        <Tabs defaultValue="fixed" onValueChange={(value) => setActiveTab(value as 'fixed' | 'custom')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="fixed">Fixed Questions ({questions.filter(q => q.is_fixed && q.active).length}/7)</TabsTrigger>
              <TabsTrigger value="custom">Custom Questions ({questions.filter(q => !q.is_fixed && q.active).length}/10)</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add {activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>
                  {activeTab === 'fixed' 
                    ? 'Fixed questions are asked to all quiz creators (7 required)' 
                    : 'Custom questions are selected by quiz creators (10 required)'}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions
                    .filter(q => q.is_fixed === (activeTab === 'fixed') && q.active)
                    .map((question) => (
                      <TableRow key={question.id}>
                        <TableCell className="font-medium">{question.text}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {question.options && question.options.map((option, idx) => (
                              <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {option}
                              </span>
                            ))}
                          </div>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      {/* Add question dialog */}
      <Dialog open={isAddDialogOpen || showAddPrompt} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setShowAddPrompt(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showAddPrompt 
                ? `Add New ${activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question`
                : `Add ${activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question`}
            </DialogTitle>
            <DialogDescription>
              {showAddPrompt 
                ? `You need to maintain ${activeTab === 'fixed' ? '7' : '10'} active questions. Please add a new question.`
                : 'Create a new question for the quiz system.'}
            </DialogDescription>
          </DialogHeader>
          
          <QuestionForm
            onSubmit={handleSubmitAdd}
            onCancel={() => {
              setIsAddDialogOpen(false);
              setShowAddPrompt(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit question dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Make changes to the question. This will create a new version.
            </DialogDescription>
          </DialogHeader>
          <QuestionForm
            initialData={selectedQuestion || undefined}
            onSubmit={handleSubmitEdit}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirm Deactivation
            </DialogTitle>
            <DialogDescription>
              This will mark the question as inactive. You'll need to add a new question to maintain the required count.
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
