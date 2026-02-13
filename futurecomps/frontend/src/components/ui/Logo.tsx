import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  variant?: "default" | "light";
}

export function Logo({ 
  className, 
  alt = "Softronix", 
  size = "md", 
  showText = true,
  animated = false,
  variant = "default"
}: LogoProps) {
  const sizes = {
    sm: { icon: "w-9 h-9", text: "text-xl", logo: "text-base" },
    md: { icon: "w-11 h-11", text: "text-2xl", logo: "text-lg" },
    lg: { icon: "w-14 h-14", text: "text-3xl", logo: "text-xl" },
    xl: { icon: "w-16 h-16", text: "text-4xl", logo: "text-2xl" },
  };

  const iconSize = sizes[size].icon;
  const textSize = sizes[size].text;

  const IconWrapper = animated ? motion.div : "div";
  const TextWrapper = animated ? motion.span : "span";

  const iconAnimationProps = animated ? {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: "spring" as const, stiffness: 200, damping: 15 }
  } : {};

  const textAnimationProps = animated ? {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { delay: 0.3, duration: 0.5 }
  } : {};

  const isLight = variant === "light";

  return (
    <div className={cn("flex items-center gap-3", className)} aria-label={alt}>
      <IconWrapper
        className={cn(
          iconSize,
          "relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25"
        )}
        {...iconAnimationProps}
      >
        {/* Subtle shine */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent" />
        <span className={cn("text-white font-extrabold relative z-10 tracking-tight", sizes[size].logo)}>S</span>
      </IconWrapper>
      
      {showText && (
        <TextWrapper
          className={cn(
            textSize,
            "font-extrabold tracking-tight select-none"
          )}
          {...textAnimationProps}
        >
          <span className={cn(
            isLight ? "text-white" : "text-slate-800 dark:text-white"
          )}>Soft</span>
          <span className={cn(
            "bg-clip-text text-transparent",
            isLight 
              ? "bg-gradient-to-r from-amber-300 to-yellow-400" 
              : "bg-gradient-to-r from-amber-500 to-yellow-500"
          )}>ronix</span>
        </TextWrapper>
      )}
    </div>
  );
}

