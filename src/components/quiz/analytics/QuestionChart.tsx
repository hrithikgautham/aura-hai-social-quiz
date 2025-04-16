
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionChartProps {
  chartData: { name: string; count: number; fill?: string }[];
  totalResponses: number;
}

export function QuestionChart({ chartData, totalResponses }: QuestionChartProps) {
  // Make sure we have data to display
  if (!chartData || chartData.length === 0 || !chartData.some(item => item.count > 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Format data for the chart
  const formattedData = chartData.map((item, index) => ({
    name: item.name,
    value: item.count, // PieChart expects 'value' property
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, 'Responses']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
