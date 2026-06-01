import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "border-transparent bg-blue-600/20 text-blue-400 hover:bg-blue-600/30",
    success: "border-transparent bg-green-600/20 text-green-400 hover:bg-green-600/30",
    warning: "border-transparent bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30",
    destructive: "border-transparent bg-red-600/20 text-red-400 hover:bg-red-600/30",
    outline: "text-foreground",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  )
}

export { Badge }
