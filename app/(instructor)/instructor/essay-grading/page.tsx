"use client";

import { EssayGradingWorkbench } from "@/components/instructor/essay-grading/essay-grading-workbench";

export default function InstructorEssayGradingPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Bài kiểm tra</p>
        <h1 className="text-2xl font-bold tracking-tight">Chấm tự luận</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Chọn khóa học, bài học và bài kiểm tra để xem các câu tự luận đang chờ
          chấm, nhập điểm và gửi phản hồi cho học viên.
        </p>
      </div>

      <EssayGradingWorkbench />
    </div>
  );
}
