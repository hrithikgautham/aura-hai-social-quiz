
import { ChartCard } from '../ChartCard';
import { Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface WeeklyPatternChartProps {
  dailyEngagementStats: Array<{ name: string; responses: number; fill: string }>;
}

export function WeeklyPatternChart({ dailyEngagementStats }: WeeklyPatternChartProps) {
  const { toast } = useToast();
  
  const hasData = dailyEngagementStats.some(day => day.responses > 0);
  
  const handleDataSelect = () => {
    if (hasData) {
      toast({
        title: "Day selected",
        description: "Viewing response count for this day of the week",
        duration: 1500,
      });
    }
  };

  return (
    <ChartCard 
      title="Weekly Response Pattern" 
      description="Responses by day of week"
    >
      <div className="h-[300px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={dailyEngagementStats} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              onMouseDown={handleDataSelect}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(155, 135, 245, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="responses" fill="#9b87f5" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white/50 rounded-lg border border-dashed border-gray-300">
            <Calendar className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground">No weekly pattern data available</p>
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-[80%]">
              This chart will show which days of the week are most popular for taking your quiz
            </p>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
