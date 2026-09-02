import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubmitQuizDialogProps {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

export default function SubmitQuizDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: SubmitQuizDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận nộp bài</DialogTitle>
          <DialogDescription>
            Sau khi nộp, bạn không thể chỉnh sửa câu trả lời của lượt làm bài
            này.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? "Đang nộp..." : "Nộp bài"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
