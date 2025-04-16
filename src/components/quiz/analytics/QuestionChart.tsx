
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionChartProps {
  chartData: { name: string; count: number }[];
  totalResponses: number;
}

export function QuestionChart({ chartData, totalResponses }: QuestionChartProps) {
  // If there's no data, return a message
  if (!chartData.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No response data available for this question</p>
      </div>
    );
  }

  const data = chartData.map(item => ({
    name: item.name,
    value: Math.round((item.count / totalResponses) * 100)
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
