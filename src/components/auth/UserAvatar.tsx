
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ className, size = "md" }: UserAvatarProps) {
  const { user } = useAuth();
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };
  
  const initials = user?.username 
    ? user.username.substring(0, 2).toUpperCase() 
    : "?";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={user?.avatar_url || ""} 
        alt={user?.username || "User avatar"} 
      />
      <AvatarFallback className="bg-gradient-to-br from-[#FF007F] to-[#00DDEB] text-white">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
