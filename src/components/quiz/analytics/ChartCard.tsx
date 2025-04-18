
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  return (
    <Card className={cn("w-full overflow-hidden border-2 border-[#FF007F]/20 transition-all hover:shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-[#FFE29F]/10 to-[#FF719A]/10 border-b border-[#FF007F]/10">
        <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00DDEB]">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {children}
      </CardContent>
    </Card>
  );
}
