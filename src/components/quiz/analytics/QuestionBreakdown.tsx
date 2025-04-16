
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF007F'];

interface QuestionBreakdownProps {
  chartData: { name: string; count: number }[];
  totalResponses: number;
}

export function QuestionBreakdown({ chartData, totalResponses }: QuestionBreakdownProps) {
  if (!chartData.length) {
    return (
      <div className="p-2">
        <h4 className="text-sm md:text-base font-medium mb-3">Response Distribution</h4>
        <p className="text-gray-500">No data available for this question</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h4 className="text-sm md:text-base font-medium mb-3">Response Distribution</h4>
      <div className="space-y-3">
        {chartData.map((item, idx) => {
          const percentage = totalResponses > 0 
            ? Math.round((item.count / totalResponses) * 100)
            : 0;
            
          return (
            <div key={idx} className="relative">
              <div className="flex justify-between items-center text-sm md:text-base mb-1">
                <div className="flex items-center max-w-[70%]">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 mr-2" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="flex-shrink-0 font-medium">
                  {item.count} ({percentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: COLORS[idx % COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
