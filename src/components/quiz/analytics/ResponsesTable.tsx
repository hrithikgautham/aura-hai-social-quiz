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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ResponsesTableProps {
  quizResponses: any[];
  quiz: any;
  quizName: string;
  quizId: string | undefined;
}

export function ResponsesTable({ quizResponses, quiz, quizName, quizId }: ResponsesTableProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUserResponse, setSelectedUserResponse] = useState<any>(null);
  const { toast } = useToast();

  const handleResponseClick = (response: any) => {
    setSelectedUserResponse(response);
    setIsDrawerOpen(true);
    toast({
      title: "Response details",
      description: "Viewing response from " + new Date(response.created_at).toLocaleDateString(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Responses</CardTitle>
        <CardDescription>Your answers to this quiz</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizResponses && quizResponses.length > 0 ? (
                quizResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      {new Date(response.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="secondary" size="sm" onClick={() => handleResponseClick(response)}>
                        View Response
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    You haven't taken this quiz yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>User Response Details</DrawerTitle>
            <DrawerDescription>
              Details of the selected user's quiz response.
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="h-[500px] p-4">
            {selectedUserResponse && selectedUserResponse.answers && quiz ? (
              <UserAnswerCard
                response={selectedUserResponse}
                questions={quiz.questions || []}
                quizName={quizName}
                quizId={quizId}
              />
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
    </Card>
  );
}
