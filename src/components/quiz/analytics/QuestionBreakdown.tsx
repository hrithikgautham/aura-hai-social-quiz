
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionBreakdownProps {
  chartData: { name: string; count: number }[];
  totalResponses: number;
}

export function QuestionBreakdown({ chartData, totalResponses }: QuestionBreakdownProps) {
  return (
    <div className="p-2">
      <h4 className="text-sm md:text-base font-medium mb-3">Response Breakdown</h4>
      <div className="space-y-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm md:text-base">
            <div className="flex items-center max-w-[70%]">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 mr-2" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="flex-shrink-0">
              {item.count} ({totalResponses > 0 
                ? `${Math.round((item.count / totalResponses) * 100)}%` 
                : '0%'}
              )
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
