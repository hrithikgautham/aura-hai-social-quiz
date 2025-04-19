
import { Users, Activity, Calendar } from 'lucide-react';
import { ChartCard } from '../ChartCard';

interface StatsCardsProps {
  totalResponses: number;
  averageAuraPoints: number;
  recentDailyResponses: number;
}

export function StatsCards({ totalResponses, averageAuraPoints, recentDailyResponses }: StatsCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <ChartCard 
        title="Total Responses" 
        className="bg-gradient-to-br from-[#FFE29F]/5 to-[#FF719A]/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-[#FF007F]">{totalResponses}</p>
            <p className="text-sm text-muted-foreground">Unique participants</p>
          </div>
          <div className="p-4 rounded-full bg-[#FFE29F]/20">
            <Users className="h-8 w-8 text-[#FF007F]" />
          </div>
        </div>
      </ChartCard>

      <ChartCard 
        title="Average Aura Score" 
        className="bg-gradient-to-br from-[#00DDEB]/5 to-[#9b87f5]/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-[#00DDEB]">{averageAuraPoints.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Average points per user</p>
          </div>
          <div className="p-4 rounded-full bg-[#00DDEB]/20">
            <Activity className="h-8 w-8 text-[#00DDEB]" />
          </div>
        </div>
      </ChartCard>

      <ChartCard 
        title="Recent Activity" 
        className="bg-gradient-to-br from-[#9b87f5]/5 to-[#7E69AB]/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-4xl font-bold text-[#9b87f5]">{recentDailyResponses}</p>
            <p className="text-sm text-muted-foreground">Recent daily responses</p>
          </div>
          <div className="p-4 rounded-full bg-[#9b87f5]/20">
            <Calendar className="h-8 w-8 text-[#9b87f5]" />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
