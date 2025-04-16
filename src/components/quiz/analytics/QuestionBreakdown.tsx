
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionBreakdownProps {
  chartData: { name: string; count: number }[];
  totalResponses: number;
}

export function QuestionBreakdown({ chartData, totalResponses }: QuestionBreakdownProps) {
  return (
    <div>
      <h4 className="font-medium mb-2">Response Breakdown</h4>
      {chartData.map((item, idx) => (
        <div key={idx} className="flex justify-between mb-1">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
          <span>
            {item.count} ({totalResponses > 0 
              ? `${Math.round((item.count / totalResponses) * 100)}%` 
              : '0%'}
            )
          </span>
        </div>
      ))}
    </div>
  );
}
