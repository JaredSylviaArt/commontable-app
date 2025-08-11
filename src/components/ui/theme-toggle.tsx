"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm">
        <Monitor className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const currentIcon = resolvedTheme === "dark" ? Moon : Sun;
  const CurrentIcon = currentIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <CurrentIcon className="h-4 w-4 transition-transform duration-200" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "light" && "bg-accent"
          )}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === "light" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "dark" && "bg-accent"
          )}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === "dark" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center gap-2 cursor-pointer",
            theme === "system" && "bg-accent"
          )}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === "system" && (
            <div className="ml-auto h-2 w-2 bg-primary rounded-full" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified toggle for mobile or compact spaces
export function SimpleThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm">
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Hook for theme-aware components
export function useThemeAware() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
    isSystem: theme === "system",
    mounted,
  };
}

// Theme-aware gradient component
export function ThemeGradient({ 
  children, 
  className,
  lightGradient = "from-blue-50 to-purple-50",
  darkGradient = "from-gray-900 to-gray-800"
}: {
  children: React.ReactNode;
  className?: string;
  lightGradient?: string;
  darkGradient?: string;
}) {
  const { isDark, mounted } = useThemeAware();

  if (!mounted) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-br transition-all duration-300",
        isDark ? `dark:${darkGradient}` : lightGradient,
        className
      )}
    >
      {children}
    </div>
  );
}

// Theme transition wrapper
export function ThemeTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="transition-colors duration-300">
      {children}
    </div>
  );
}
