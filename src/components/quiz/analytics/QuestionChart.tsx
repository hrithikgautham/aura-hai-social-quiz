
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionChartProps {
  chartData: { name: string; count: number; fill?: string }[];
  totalResponses: number;
}

export function QuestionChart({ chartData, totalResponses }: QuestionChartProps) {
  if (!chartData || chartData.length === 0 || !chartData.some(item => item.count > 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <ChartContainer
      config={
        chartData.reduce((acc, item, idx) => {
          acc[item.name] = { color: COLORS[idx % COLORS.length] };
          return acc;
        }, {} as Record<string, { color: string }>)
      }
    >
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="count"
          nameKey="name"
          label
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ChartContainer>
  );
}
