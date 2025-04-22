
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizAnalyticsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  loading: boolean;
  error: string | null;
}

export function QuizAnalyticsLayout({ 
  children, 
  title = "Quiz Analytics", 
  description,
  loading,
  error
}: QuizAnalyticsLayoutProps) {
  const navigate = useNavigate();

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
          <div className="p-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full mt-4" />
            <Skeleton className="h-32 w-full mt-4" />
          </div>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
      </div>
      {description && <p className="mb-6 text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
