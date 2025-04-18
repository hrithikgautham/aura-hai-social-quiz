
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { auraColors } from '@/utils/auraCalculations';

interface AuraPointsChartProps {
  overallAuraPoints: { [aura: string]: number };
}

export function AuraPointsChart({ overallAuraPoints }: AuraPointsChartProps) {
  const overallAuraData = Object.entries(overallAuraPoints).map(([aura, points]) => ({
    name: aura,
    points: points,
    color: auraColors[aura as keyof typeof auraColors]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overall Aura Points</CardTitle>
        <CardDescription>Distribution of aura points across all responses</CardDescription>
      </CardHeader>
      <CardContent>
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
                fill="#8884d8"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {overallAuraData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
