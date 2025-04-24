
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { UserAnswerCard } from "@/components/quiz/UserAnswerCard";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsesTableProps {
  quizResponses: any[];
  quiz: any;
  quizName: string;
  quizId: string | undefined;
}

export function ResponsesTable({ quizResponses, quiz, quizName, quizId }: ResponsesTableProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserResponse, setSelectedUserResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResponseClick = (response: any) => {
    setIsLoading(true);
    setSelectedUserResponse(response);
    setIsDrawerOpen(true);
    
    // Simulate loading for a smoother experience
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Response details loaded",
        description: "Viewing response from " + new Date(response.created_at).toLocaleDateString(),
      });
    }, 300);
  };

  // Animation effect when component mounts
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <Card className={cn(
      "transform transition-all duration-500 border-2",
      show ? "translate-y-0 opacity-100 border-[#00DDEB]/30 shadow-lg hover:shadow-xl" : "translate-y-4 opacity-0 border-gray-200",
      quizResponses && quizResponses.length > 0 ? "border-[#00DDEB]/30" : "border-gray-200"
    )}>
      <CardHeader className="bg-gradient-to-r from-[#00DDEB]/10 to-white border-b border-[#00DDEB]/20">
        <CardTitle className="text-xl flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-[#00DDEB]" />
          Your Responses
        </CardTitle>
        <CardDescription>Your answers to this quiz</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-[#00DDEB]/5">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizResponses && quizResponses.length > 0 ? (
                  quizResponses.map((response, index) => (
                    <TableRow 
                      key={response.id}
                      className={cn(
                        "cursor-pointer transition-colors animate-fade-in",
                        "hover:bg-[#00DDEB]/10 hover:scale-[1.01]"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TableCell className="flex items-center gap-2 py-4">
                        <Calendar className="h-4 w-4 text-[#00DDEB]" />
                        {new Date(response.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => handleResponseClick(response)}
                          className="bg-[#00DDEB]/20 hover:bg-[#00DDEB]/40 text-[#00DDEB] border border-[#00DDEB]/30"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-[300px] text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 rounded-full bg-gray-100 animate-pulse">
                          <AlertCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium text-gray-500">You haven't taken this quiz yet</p>
                        <p className="text-sm text-gray-400 max-w-[250px] text-center">
                          Take the quiz to see your responses and aura points analysis
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="bg-gradient-to-r from-[#00DDEB]/10 to-white border-b">
            <DrawerTitle>Your Quiz Response</DrawerTitle>
            <DrawerDescription>
              Detailed breakdown of your answers to {quizName}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[60vh] p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-[#00DDEB]/30 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-[#00DDEB]/50"></div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Loading your response...</p>
                </div>
              </div>
            ) : selectedUserResponse && selectedUserResponse.answers && quiz ? (
              <UserAnswerCard
                response={selectedUserResponse}
                questions={quiz.questions || {}}
                quizName={quizName}
                quizId={quizId}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No response data available.</p>
              </div>
            )}
          </ScrollArea>
          <DrawerFooter className="border-t bg-gray-50">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  );
}
