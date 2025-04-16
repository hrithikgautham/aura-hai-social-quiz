
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

interface LeaderboardCardProps {
  responses: ResponseData[];
}

export function LeaderboardCard({ responses }: LeaderboardCardProps) {
  const sortedResponses = [...responses]
    .sort((a, b) => b.aura_points - a.aura_points)
    .slice(0, 5); // Show top 5 respondents

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
        <CardDescription>Top respondents by aura points</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedResponses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Respondent</TableHead>
                <TableHead className="text-right">Aura Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedResponses.map((response, index) => (
                <TableRow key={response.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(index)}
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>{response.respondent_id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-right">{response.aura_points}</TableCell>
                </TableRow>
              ))}
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
