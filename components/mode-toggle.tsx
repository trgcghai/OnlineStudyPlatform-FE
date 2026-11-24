"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const themes = [
  { name: "light", icon: Sun },
  { name: "dark", icon: Moon },
  { name: "system", icon: Monitor },
] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const currentIndex = themes.findIndex((item) => item.name === theme);
  const currentTheme = themes[currentIndex] ?? themes[2];

  const toggleTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex].name);
  };

  const Icon = currentTheme.icon;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10 sm:size-9"
      onClick={toggleTheme}
      aria-label={`Current theme: ${currentTheme.name}`}
    >
      <Icon className="size-4" />
    </Button>
  );
}
