import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md": variant === "default",
            "border border-green-600 bg-white hover:bg-green-50 text-green-600": variant === "outline",
            "hover:bg-gray-100 hover:text-gray-900": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 shadow-sm": variant === "destructive",
            "bg-green-100 text-green-900 hover:bg-green-200": variant === "secondary",
            "h-12 px-6 py-3": size === "default",
            "h-9 px-4 text-xs": size === "sm",
            "h-14 px-8 text-base": size === "lg",
            "h-12 w-12": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
