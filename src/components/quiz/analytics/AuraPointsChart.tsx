
import { ChartCard } from './ChartCard';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { auraColors } from '@/utils/auraCalculations';
import { AuraPoints } from '@/types/quiz-analytics';

interface AuraPointsChartProps {
  overallAuraPoints: AuraPoints;
}

export function AuraPointsChart({ overallAuraPoints }: AuraPointsChartProps) {
  const overallAuraData = Object.entries(overallAuraPoints).map(([aura, points]) => ({
    name: aura.charAt(0).toUpperCase() + aura.slice(1),
    points: points,
    color: auraColors[aura as keyof typeof auraColors]
  }));

  return (
    <ChartCard 
      title="Overall Aura Points" 
      description="Distribution of aura points across all responses"
    >
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={overallAuraData} 
              dataKey="points" 
              nameKey="name"
              cx="50%" 
              cy="50%" 
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              paddingAngle={2}
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {overallAuraData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm font-medium">{value}</span>}
            />
            <RechartsTooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: '2px solid rgba(255, 0, 127, 0.1)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
