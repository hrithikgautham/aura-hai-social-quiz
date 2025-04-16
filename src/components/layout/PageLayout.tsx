
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PageLayout = ({ children, className }: PageLayoutProps) => {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A] p-4 md:p-8",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
