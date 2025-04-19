
import { ChartCard } from '../ChartCard';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineChartProps {
  participationData: Array<{ date: string; responses: number }>;
}

export function TimelineChart({ participationData }: TimelineChartProps) {
  return (
    <ChartCard 
      title="Participation Timeline" 
      description="Response submissions over time"
    >
      <div className="h-[300px]">
        {participationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={participationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="participationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00DDEB" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#00DDEB" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 221, 235, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area type="monotone" dataKey="responses" stroke="#00DDEB" fill="url(#participationGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-white/50 rounded-lg border border-dashed border-gray-300">
            <Activity className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-muted-foreground">No timeline data available</p>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
