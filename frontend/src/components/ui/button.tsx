import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal Button matching the variants/sizes used by the ported Aimher screens.

type Variant = "default" | "outline" | "clinical" | "destructive" | "ghost";
type Size = "default" | "sm" | "lg" | "xl" | "icon";

const variantClasses: Record<Variant, string> = {
  default: "bg-teal-600 text-white hover:bg-teal-700",
  clinical: "bg-[#00897B] text-white hover:bg-[#00796B]",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-700 hover:bg-gray-100",
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-8 text-lg",
  icon: "h-10 w-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
