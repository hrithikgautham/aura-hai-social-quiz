
import { ChartCard } from './ChartCard';
import { PieChart, Pie, Cell, Legend, Tooltip as RechartsTooltip, ResponsiveContainer, Sector } from 'recharts';
import { auraColors } from '@/utils/auraCalculations';
import { AuraPoints } from '@/types/quiz-analytics';
import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AuraPointsChartProps {
  overallAuraPoints: AuraPoints;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="animate-pulse"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 15}
        outerRadius={outerRadius + 20}
        fill={fill}
      />
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill={fill} className="font-semibold text-lg">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" className="text-sm text-gray-500">
        {`${(percent * 100).toFixed(0)}% (${value} points)`}
      </text>
    </g>
  );
};

export function AuraPointsChart({ overallAuraPoints }: AuraPointsChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Simple animation that cycles through the aura types
    if (hasData) {
      const timer = setInterval(() => {
        setActiveIndex((prevIndex) => 
          prevIndex >= overallAuraData.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
      
      // After one cycle, stop the animation
      setTimeout(() => {
        clearInterval(timer);
        setHasAnimated(true);
      }, 3000 * (overallAuraData.length + 1));
      
      return () => clearInterval(timer);
    }
  }, []); // Empty dependency array means it runs once on mount

  const overallAuraData = Object.entries(overallAuraPoints)
    .map(([aura, points]) => ({
      name: aura.charAt(0).toUpperCase() + aura.slice(1),
      points: points,
      color: auraColors[aura as keyof typeof auraColors]
    }))
    .filter(item => item.points > 0); // Only include aura types with points
  
  const hasData = overallAuraData.length > 0;
  
  const onPieEnter = (_: any, index: number) => {
    if (hasAnimated) {
      setActiveIndex(index);
    }
  };

  return (
    <ChartCard 
      title="Overall Aura Points" 
      description="Distribution of aura points across all responses"
      className={cn(
        "border-2 transition-all duration-300",
        hasData ? "border-[#FF007F]/30 shadow-lg hover:shadow-xl" : "border-gray-200"
      )}
    >
      <div className="h-[350px] relative">
        {hasData ? (
          <div className="animate-fade-in">
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
                  paddingAngle={4}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={onPieEnter}
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {overallAuraData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                      className={activeIndex === index ? "animate-pulse" : ""}
                    />
                  ))}
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                    <span className={cn(
                      "text-sm font-medium px-2 py-1 rounded-full transition-all",
                      overallAuraData.findIndex(d => d.name === value) === activeIndex 
                        ? "bg-gray-100 scale-110" 
                        : ""
                    )}>
                      {value}
                    </span>
                  )}
                  onClick={(data) => {
                    const index = overallAuraData.findIndex(d => d.name === data.value);
                    setActiveIndex(index);
                  }}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 0, 127, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name) => [`${value} points`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="p-4 rounded-full bg-[#FFE29F]/20 mb-4 animate-pulse">
              <Activity className="h-12 w-12 text-[#FF007F] opacity-60" />
            </div>
            <p className="text-center text-gray-500 font-medium">No aura points data available yet</p>
            <p className="text-sm text-gray-400 text-center mt-2 max-w-[80%]">
              As people complete the quiz, their aura points will be visualized here
            </p>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
