
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
import { AlertCircle, Edit, Trash2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [reactivationType, setReactivationType] = useState<'fixed' | 'custom'>('fixed');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [replacingDeactivated, setReplacingDeactivated] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [activeTab, showDeactivated]);
  
  const fetchQuestions = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_fixed', activeTab === 'fixed')
        .eq('active', !showDeactivated) // Toggle between active and inactive questions
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

  const handleReactivate = (question: Question) => {
    setSelectedQuestion(question);
    setIsReactivateDialogOpen(true);
  };

  const handleAddNewQuestion = () => {
    // Check if we've reached the maximum allowed questions
    const maxQuestions = activeTab === 'fixed' ? 7 : 10;
    const activeCount = questions.filter(q => q.active).length;
    
    if (activeCount >= maxQuestions) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You already have ${maxQuestions} active ${activeTab} questions. Please deactivate one first before adding a new one.`,
      });
      return;
    }
    
    setIsAddDialogOpen(true);
    setReplacingDeactivated(false);
  };

  const handleSubmitAdd = async (data: { text: string; options: string[] }) => {
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

      // After deactivating, prompt to add a new question to maintain required count
      setIsDeleteDialogOpen(false);
      setReplacingDeactivated(true);
      setIsAddDialogOpen(true);
      
      fetchQuestions();
    } catch (error) {
      console.error('Error deactivating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate question.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!selectedQuestion) return;

    // Check if we've reached the maximum allowed questions
    const isFixed = reactivationType === 'fixed';
    const maxQuestions = isFixed ? 7 : 10;
    
    // Get current active questions count of the target type
    const { data: activeQuestions, error: countError } = await supabase
      .from('questions')
      .select('id')
      .eq('is_fixed', isFixed)
      .eq('active', true);
      
    if (countError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check active questions count.",
      });
      return;
    }
    
    if (activeQuestions && activeQuestions.length >= maxQuestions) {
      toast({
        variant: "destructive",
        title: "Limit Reached",
        description: `You already have ${maxQuestions} active ${reactivationType} questions. You need to deactivate one first.`,
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('questions')
        .update({ 
          active: true,
          is_fixed: isFixed
        })
        .eq('id', selectedQuestion.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question has been reactivated.",
      });

      setIsReactivateDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error reactivating question:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reactivate question.",
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
          <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
            <TabsList>
              <TabsTrigger value="fixed">Fixed Questions ({questions.filter(q => q.is_fixed && q.active).length}/7)</TabsTrigger>
              <TabsTrigger value="custom">Custom Questions ({questions.filter(q => !q.is_fixed && q.active).length}/10)</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeactivated(!showDeactivated)}
              >
                {showDeactivated ? "Show Active" : "Show Deactivated"}
              </Button>
              
              {!showDeactivated && (
                <Button onClick={handleAddNewQuestion}>
                  Add {activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question
                </Button>
              )}
            </div>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>
                  {showDeactivated 
                    ? 'Deactivated questions can be reactivated' 
                    : activeTab === 'fixed' 
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
                  {questions.map((question) => (
                    <TableRow 
                      key={question.id}
                      className={showDeactivated ? "opacity-60" : ""}
                    >
                      <TableCell className="font-medium">
                        {question.text}
                        {showDeactivated && <span className="ml-2 text-xs text-red-500">(Deactivated)</span>}
                      </TableCell>
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
                          {showDeactivated ? (
                            <Button variant="outline" size="icon" onClick={() => handleReactivate(question)}>
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="icon" onClick={() => handleEdit(question)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" onClick={() => handleDelete(question)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {questions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        {showDeactivated 
                          ? "No deactivated questions found"
                          : `No ${activeTab} questions found`}
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setShowAddPrompt(false);
          setReplacingDeactivated(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {replacingDeactivated
                ? `Replace Deactivated ${activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question`
                : `Add ${activeTab === 'fixed' ? 'Fixed' : 'Custom'} Question`}
            </DialogTitle>
            <DialogDescription>
              {replacingDeactivated
                ? `You've deactivated a question. Please add a new one to maintain ${activeTab === 'fixed' ? '7' : '10'} active questions.`
                : 'Create a new question for the quiz system.'}
            </DialogDescription>
          </DialogHeader>
          
          <QuestionForm
            onSubmit={handleSubmitAdd}
            onCancel={() => {
              setIsAddDialogOpen(false);
              setShowAddPrompt(false);
              setReplacingDeactivated(false);
            }}
            isReplacingDeactivated={replacingDeactivated}
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

      {/* Reactivate confirmation dialog */}
      <Dialog open={isReactivateDialogOpen} onOpenChange={setIsReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-blue-500" />
              Reactivate Question
            </DialogTitle>
            <DialogDescription>
              Select where you want to reactivate this question.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md p-3 my-2 bg-gray-50">
            {selectedQuestion?.text}
          </div>

          <div className="my-4">
            <RadioGroup 
              value={reactivationType}
              onValueChange={(value) => setReactivationType(value as 'fixed' | 'custom')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem id="fixed" value="fixed" />
                <Label htmlFor="fixed" className="w-full cursor-pointer">
                  Fixed Question Section (Asked to all users)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem id="custom" value="custom" />
                <Label htmlFor="custom" className="w-full cursor-pointer">
                  Custom Question Section (Users select from these)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReactivateDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="default" 
              onClick={handleConfirmReactivate}
              disabled={loading}
            >
              {loading ? 'Reactivating...' : 'Reactivate Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
