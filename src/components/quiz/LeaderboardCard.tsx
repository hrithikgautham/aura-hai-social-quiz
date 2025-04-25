
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardProps {
  responses: any[];
}

export function LeaderboardCard({ responses }: LeaderboardProps) {
  const filteredResponses = responses
    .filter(response => !response.is_creator) // Filter out creator responses
    .sort((a, b) => (b.aura_points || 0) - (a.aura_points || 0))
    .slice(0, 10);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Leaderboard</CardTitle>
        <CardDescription className="text-sm md:text-base">Top participants by aura points</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aura Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResponses.map((response, index) => (
                <tr key={response.id}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{index + 1}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={response.users?.avatar_url} alt={response.users?.username} />
                          <AvatarFallback>{response.users?.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{response.users?.username}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{response.aura_points}</div>
                  </td>
                </tr>
              ))}
              {filteredResponses.length === 0 && (
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-center" colSpan={3}>
                    <div className="text-sm text-gray-500">No responses yet. Be the first to take the quiz!</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
