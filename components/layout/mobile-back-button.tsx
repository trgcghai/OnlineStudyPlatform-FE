"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBackButtonProps {
  fallbackHref: string;
  label?: string;
  className?: string;
}

export function MobileBackButton({
  fallbackHref,
  label = "Quay lại",
  className,
}: MobileBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-11 shrink-0 md:hidden", className)}
      aria-label={label}
      onClick={handleBack}
    >
      <ArrowLeft aria-hidden="true" />
    </Button>
  );
}
