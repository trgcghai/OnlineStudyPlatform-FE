import { Button } from "@/components/ui/button";

export function SmartReminderPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <Button disabled className="w-full sm:w-auto">
        Gửi Smart Reminder
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">
        Sắp có trong T3-06. Tính năng này sẽ gửi nhắc nhở thông minh cho học
        viên có rủi ro cao.
      </p>
    </div>
  );
}
