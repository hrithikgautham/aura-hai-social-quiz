
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { QuizSettings } from './QuizSettings';

interface QuizHeaderCardProps {
  quizName: string;
  quizDescription: string;
  quizId: string | undefined;
  isPublic: boolean;
  onDelete: () => void;
  onShare: () => void;
  onUpdate: (name: string, description: string, isPublic: boolean) => void;
}

export function QuizHeaderCard({ 
  quizName, 
  quizDescription, 
  quizId,
  isPublic,
  onDelete,
  onShare,
  onUpdate
}: QuizHeaderCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
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
            <DropdownMenuItem onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      {showSettings && (
        <QuizSettings
          quizId={quizId}
          quizName={quizName}
          quizDescription={quizDescription}
          isPublic={isPublic}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onShare={onShare}
        />
      )}
      {!showSettings && quizDescription && <CardDescription className="px-6 pb-4">{quizDescription}</CardDescription>}
    </Card>
  );
}
