
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponseData } from '@/types/quiz';
import { Medal, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';

interface LeaderboardCardProps {
  responses: ResponseData[];
}

interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
}

export function LeaderboardCard({ responses }: LeaderboardCardProps) {
  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const [creatorData, setCreatorData] = useState<{ id: string; username: string; avatar_url?: string } | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get all unique user IDs from responses
        const userIds = responses.map(r => r.respondent_id);
        
        if (userIds.length === 0) return;

        // Fetch user data for all respondents
        const { data, error } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (error) {
          console.error('Error fetching users:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load user data for leaderboard.",
          });
          return;
        }

        // Create a map of user IDs to user data
        const usersMap = data?.reduce((acc: Record<string, UserData>, user) => {
          acc[user.id] = user;
          return acc;
        }, {}) || {};

        setUsersData(usersMap);
      } catch (err) {
        console.error('Error in fetchUsers:', err);
      }
    };

    const fetchCreator = async () => {
      try {
        if (responses.length === 0) return;
        
        // Get quiz ID from the first response
        const quizId = responses[0].quiz_id;
        
        // Fetch quiz data to get creator ID
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('creator_id')
          .eq('id', quizId)
          .single();
        
        if (quizError) {
          console.error('Error fetching quiz creator:', quizError);
          return;
        }
        
        if (quizData && quizData.creator_id) {
          // Fetch creator user data
          const { data: creatorUserData, error: creatorError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', quizData.creator_id)
            .single();
          
          if (creatorError) {
            console.error('Error fetching creator user data:', creatorError);
            return;
          }
          
          setCreatorData(creatorUserData);
        }
      } catch (err) {
        console.error('Error in fetchCreator:', err);
      }
    };

    if (responses.length > 0) {
      fetchUsers();
      fetchCreator();
    }
  }, [responses, toast]);

  // Sort responses by aura points in descending order
  const sortedResponses = [...responses]
    .sort((a, b) => b.aura_points - a.aura_points);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>All respondents by aura points</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedResponses.length > 0 || creatorData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Aura Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatorData && (
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      Creator
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={creatorData.avatar_url || ''} alt={creatorData.username} />
                        <AvatarFallback>{creatorData.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {creatorData.username}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">100000</TableCell>
                </TableRow>
              )}
              {sortedResponses.map((response, index) => {
                const user = usersData[response.respondent_id];
                
                // Render placeholder if user data isn't loaded yet
                if (!user) {
                  return (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getMedalIcon(index)}
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                          Loading user...
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{response.aura_points}</TableCell>
                    </TableRow>
                  );
                }
                
                return (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getMedalIcon(index)}
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{response.aura_points}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="py-6 text-center text-gray-500">
            No responses yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
