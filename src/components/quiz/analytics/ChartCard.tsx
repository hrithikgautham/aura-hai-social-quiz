
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChartCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({
  title,
  description,
  className,
  children,
}: ChartCardProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className={cn(
      "w-full overflow-hidden transition-all duration-300 hover:shadow-xl", 
      "border-2 border-[#FF007F]/20",
      "bg-gradient-to-br from-white to-pink-50/50",
      className
    )}>
      <CardHeader className={cn(
        "bg-gradient-to-r from-[#FFE29F]/20 to-[#FF719A]/20", 
        "border-b border-[#FF007F]/10",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className="relative">
          {/* Decorative elements for quirky design */}
          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#FF007F]/10 animate-pulse" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[#00DDEB]/10 animate-pulse" />
          
          <CardTitle className={cn(
            "text-xl md:text-2xl font-bold", 
            "bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]",
            "relative z-10"
          )}>
            {title}
          </CardTitle>
        </div>
        
        {description && (
          <CardDescription className="text-sm md:text-base mt-1 text-gray-600">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(
        "p-4 md:p-6 relative",
        "bg-[url('/lovable-uploads/sparkles-pattern.png')] bg-fixed bg-opacity-5"
      )}>
        {/* Subtle decorative corner */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-[#FF007F]/5 rounded-tl-[100px] -z-0" />
        
        <div className="relative z-10">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
