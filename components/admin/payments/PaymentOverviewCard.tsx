import { Card, CardContent } from "@/components/ui/card";
import { ComponentType } from "react";

export default function PaymentOverviewCard({
  description,
  icon: Icon,
  title,
  value,
}: {
  description: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
}) {
  return (
    <Card className="py-0!">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
