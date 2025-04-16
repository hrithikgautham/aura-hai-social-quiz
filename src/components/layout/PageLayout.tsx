
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  isQuizCreate?: boolean;
}

const PageLayout = ({ children, className, isQuizCreate }: PageLayoutProps) => {
  if (isQuizCreate) {
    return (
      <div 
        className={cn(
          "min-h-screen p-4 md:p-8 bg-cover bg-center bg-no-repeat",
          "before:content-[''] before:absolute before:inset-0 before:bg-white/80 before:z-0",
          className
        )}
        style={{ 
          backgroundImage: "url('/lovable-uploads/4514b60b-b002-4e55-9dcd-d61473f8509f.png')",
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-gradient-to-br from-[#FFE29F] via-[#FFA99F] to-[#FF719A] p-4 md:p-8",
        "before:content-[''] before:fixed before:inset-0 before:bg-[url('/lovable-uploads/sparkles-pattern.png')] before:opacity-5 before:z-0",
        className
      )}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
