import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 border-transparent",
        {
          "bg-green-500 text-white": variant === "default",
          "bg-green-100 text-green-800": variant === "secondary",
          "bg-red-500 text-white": variant === "destructive",
          "bg-[#FACC15] text-[#713f12]": variant === "warning",
          "text-gray-900 border-gray-200 bg-white": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
