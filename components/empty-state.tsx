import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex w-full justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          {icon ? (
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {icon}
            </div>
          ) : null}
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tính năng đang được phát triển.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
