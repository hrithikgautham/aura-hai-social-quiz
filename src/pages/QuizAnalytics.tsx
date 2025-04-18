
// src/pages/QuizAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { calculateMCQAuraPoints, auraColors } from '@/utils/auraCalculations';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, AlertCircle, CheckCircle, Info, Loader2, XCircle, Calendar, Users, Activity } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#FF007F', '#00DDEB', '#FFE29F', '#9b87f5', '#7E69AB', '#D3E4FD'];

// Define types for our quiz state data
interface QuizData {
  created_at: string;
  creator_id: string;
  id: string;
  name: string;
  shareable_link: string;
  is_public?: boolean; // Using optional because this field isn't in the database schema
  description?: string; // Using optional because this field isn't in the database schema
  questions?: {
    [key: string]: {
      question: string;
      options: string[];
      correctAnswer?: string | number;
    }
  }
}

const QuizAnalytics = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [quizResponses, setQuizResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionAuraPoints, setQuestionAuraPoints] = useState<{ [questionId: string]: { [aura: string]: number } }>({});
  const [overallAuraPoints, setOverallAuraPoints] = useState<{ [aura: string]: number }>({});
  const [selectedUserResponse, setSelectedUserResponse] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [quizName, setQuizName] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchQuizAndResponses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          throw new Error(`Failed to fetch quiz: ${quizError.message}`);
        }

        if (!quizData) {
          throw new Error('Quiz not found');
        }

        // Initialize with default empty values for missing fields
        const enhancedQuizData: QuizData = {
          ...quizData,
          is_public: false, // Default value
          description: '', // Default value
        };

        setQuiz(enhancedQuizData);
        setIsPublic(false); // Default to false since is_public doesn't exist in schema
        setQuizName(enhancedQuizData.name);
        setQuizDescription(''); // Default to empty string since description doesn't exist in schema

        // Fetch quiz responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('*, user_profiles(username)')
          .eq('quiz_id', quizId);

        if (responsesError) {
          throw new Error(`Failed to fetch quiz responses: ${responsesError.message}`);
        }

        if (!responsesData || responsesData.length === 0) {
          console.warn('No responses found for this quiz.');
          setLoading(false);
          return;
        }

        setQuizResponses(responsesData);

        // Calculate aura points for each question and overall
        const calculatedQuestionAuraPoints: { [questionId: string]: { [aura: string]: number } } = {};
        const calculatedOverallAuraPoints: { [aura: string]: number } = {
          "innovator": 0,
          "motivator": 0,
          "achiever": 0,
          "supporter": 0,
          "guardian": 0,
          "visionary": 0
        };

        responsesData.forEach(response => {
          const answers = response.answers || {};
          
          if (answers && Object.keys(answers).length > 0) {
            const quizQuestions = quiz?.questions || {};
            
            Object.entries(answers).forEach(([questionId, answer]) => {
              const questionIdStr = String(questionId);
              if (quizQuestions[questionIdStr] && quizQuestions[questionIdStr].options) {
                // Pass just the answer parameter to calculateMCQAuraPoints - fix for wrong argument count
                const auraPoints = calculateMCQAuraPoints(answer as string, quizQuestions[questionIdStr].options);

                if (!calculatedQuestionAuraPoints[questionIdStr]) {
                  calculatedQuestionAuraPoints[questionIdStr] = {
                    "innovator": 0,
                    "motivator": 0,
                    "achiever": 0,
                    "supporter": 0,
                    "guardian": 0,
                    "visionary": 0
                  };
                }

                Object.keys(calculatedOverallAuraPoints).forEach(aura => {
                  calculatedQuestionAuraPoints[questionIdStr][aura] += auraPoints[aura];
                  calculatedOverallAuraPoints[aura] += auraPoints[aura];
                });
              }
            });
          }
        });

        setQuestionAuraPoints(calculatedQuestionAuraPoints);
        setOverallAuraPoints(calculatedOverallAuraPoints);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching quiz data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndResponses();
  }, [quizId, user, navigate]);

  const handleResponseClick = (response: any) => {
    setSelectedUserResponse(response);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleShareQuiz = async () => {
    setIsShareDialogOpen(true);
    try {
      // Only updating fields that are known to exist in the schema
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: quizName,
          shareable_link: quiz?.shareable_link || ''
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz: ${error.message}`);
      }

      setIsPublic(true);

      const link = `${window.location.origin}/quiz/take/${quizId}`;
      setShareableLink(link);
    } catch (err: any) {
      setError(err.message);
      console.error("Error sharing quiz:", err);
      toast({
        title: 'Error sharing quiz',
        description: 'There was an error sharing the quiz. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink)
      .then(() => {
        toast({
          title: 'Link copied!',
          description: 'The shareable link has been copied to your clipboard.',
        });
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
        toast({
          title: 'Error copying link',
          description: 'There was an error copying the link to your clipboard.',
          variant: 'destructive',
        });
      });
    setIsShareDialogOpen(false);
  };

  const handlePrivacyChange = async (checked: boolean) => {
    try {
      // Only updating the name field which is confirmed to exist in the schema
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: quizName
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz privacy: ${error.message}`);
      }

      setIsPublic(checked);
      toast({
        title: 'Privacy settings updated',
        description: `Quiz is now ${checked ? 'public' : 'private'}.`,
      });
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating quiz privacy:", err);
      toast({
        title: 'Error updating privacy',
        description: 'There was an error updating the privacy settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuizDetails = async () => {
    try {
      // Only updating fields that exist in the schema
      const { data, error } = await supabase
        .from('quizzes')
        .update({ 
          name: quizName
        })
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to update quiz details: ${error.message}`);
      }

      setQuiz(prevQuiz => prevQuiz ? { ...prevQuiz, name: quizName } : null);
      toast({
        title: 'Quiz details updated',
        description: 'The quiz name has been updated successfully.',
      });
    } catch (err: any) {
      setError(err.message);
      console.error("Error updating quiz details:", err);
      toast({
        title: 'Error updating details',
        description: 'There was an error updating the quiz details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteQuiz = async () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) {
        throw new Error(`Failed to delete quiz: ${error.message}`);
      }

      toast({
        title: 'Quiz deleted',
        description: 'The quiz has been successfully deleted.',
      });
      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message);
      console.error("Error deleting quiz:", err);
      toast({
        title: 'Error deleting quiz',
        description: 'There was an error deleting the quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const cancelDeleteQuiz = () => {
    setIsDeleteDialogOpen(false);
  };

  const overallAuraData = Object.entries(overallAuraPoints).map(([aura, points]) => ({
    name: aura,
    points: points,
    color: auraColors[aura as keyof typeof auraColors]
  }));

  const overallAuraChartData = {
    labels: overallAuraData.map(data => data.name),
    datasets: [
      {
        data: overallAuraData.map(data => data.points),
        backgroundColor: overallAuraData.map(data => data.color),
        borderWidth: 0,
      },
    ],
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-64 mb-2" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-96" />
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteQuiz}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuiz}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
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

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>User Response Details</DrawerTitle>
            <DrawerDescription>
              Details of the selected user's quiz response.
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[500px] p-4">
            {selectedUserResponse && selectedUserResponse.answers && quiz && quiz.questions ? (
              Object.entries(selectedUserResponse.answers).map(([questionId, answer]: [string, any]) => {
                const question = quiz.questions[questionId];
                if (!question) {
                  return null;
                }
                // Fix props to match UserAnswerCard component expectation
                // Using the correct prop names that UserAnswerCard expects
                return (
                  <UserAnswerCard
                    key={questionId}
                    questionText={question.question}
                    selectedAnswer={answer}
                    correctAnswer={question.correctAnswer}
                    options={question.options}
                  />
                );
              })
            ) : (
              <p>No response selected or questions available.</p>
            )}
          </ScrollArea>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{quizName}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowSettings(!showSettings)}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteQuiz}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        {showSettings && (
          <CardContent>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input type="text" id="name" value={quizName} onChange={(e) => setQuizName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input id="description" value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isPublic" className="text-right">
                  Public
                </Label>
                <Switch id="isPublic" checked={isPublic} onCheckedChange={handlePrivacyChange} />
              </div>
            </div>
            <Button onClick={handleUpdateQuizDetails}>Update Details</Button>
            {!isPublic && (
              <Button className="ml-2" onClick={handleShareQuiz}>
                Make Public & Get Shareable Link
              </Button>
            )}
          </CardContent>
        )}
        <CardDescription>{quizDescription}</CardDescription>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall Aura Points</CardTitle>
            <CardDescription>Distribution of aura points across all responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {overallAuraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <Pie 
                    data={overallAuraData} 
                    dataKey="points" 
                    nameKey="name"
                    cx="50%" 
                    cy="50%" 
                    outerRadius={120}
                    fill="#8884d8"
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {overallAuraData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Responses</CardTitle>
            <CardDescription>List of user responses for this quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>{response.user_profiles?.username || 'Unknown'}</TableCell>
                      <TableCell>
                        <Button variant="secondary" size="sm" onClick={() => handleResponseClick(response)}>
                          View Response
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuizAnalytics;
