
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionChartProps {
  chartData: { name: string; count: number; fill?: string }[];
  totalResponses: number;
}

export function QuestionChart({ chartData, totalResponses }: QuestionChartProps) {
  const isMobile = useIsMobile();

  if (!chartData || chartData.length === 0 || !chartData.some(item => item.count > 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm md:text-base">No responses yet</p>
      </div>
    );
  }

  const formattedData = chartData.map((item, index) => ({
    name: item.name,
    value: item.count,
    percentage: totalResponses > 0 ? Math.round((item.count / totalResponses) * 100) : 0,
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? 60 : 80}
          dataKey="value"
          nameKey="name"
          label={({ name, percentage }) => `${percentage}%`}
          labelLine={false}
        >
          {formattedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => {
            const entry = formattedData.find(item => item.name === name);
            return [`${entry?.percentage}% (${value} responses)`, name];
          }}
          contentStyle={{ 
            fontSize: isMobile ? '12px' : '14px',
            backgroundColor: 'white',
            border: '1px solid #ccc'
          }}
        />
        <Legend 
          layout={isMobile ? "horizontal" : "vertical"}
          align={isMobile ? "center" : "right"}
          verticalAlign={isMobile ? "bottom" : "middle"}
          wrapperStyle={{ 
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '10px 0' : '0'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
