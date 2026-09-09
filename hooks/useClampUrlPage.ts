import { useEffect } from "react";

interface UseClampUrlPageOptions {
  page: number;
  totalPages: number;
  enabled: boolean;
  onPageChange: (page: number) => void;
}

export function useClampUrlPage({
  page,
  totalPages,
  enabled,
  onPageChange,
}: UseClampUrlPageOptions) {
  useEffect(() => {
    if (!enabled) return;

    if (totalPages < 1) {
      if (page > 1) onPageChange(1);
      return;
    }

    if (page <= totalPages) return;

    onPageChange(totalPages);
  }, [enabled, onPageChange, page, totalPages]);
}
