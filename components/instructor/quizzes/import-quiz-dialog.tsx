"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useImportInstructorQuiz } from "@/hooks/useInstructorQuizzes";
import type { QuizImportResult } from "@/services/api/quizzes";

interface ImportQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
}

export function ImportQuizDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
}: ImportQuizDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<QuizImportResult | null>(null);
  const { importInstructorQuiz, isPending } = useImportInstructorQuiz();

  function resetState() {
    setFile(null);
    setError(null);
    setDetails([]);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setError(null);
    setDetails([]);
    setResult(null);

    if (nextFile && !nextFile.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Chỉ hỗ trợ tệp Excel có định dạng .xlsx.");
      return;
    }

    setFile(nextFile);
  }

  async function handleImport() {
    if (!file) {
      setError("Hãy chọn một tệp .xlsx trước khi import.");
      return;
    }

    setError(null);
    setDetails([]);
    const importResult = await importInstructorQuiz(courseId, lessonId, file);
    if (!importResult.ok) {
      setError(importResult.message ?? "Không thể import câu hỏi.");
      setDetails(importResult.details ?? []);
      return;
    }

    setResult(importResult.data as QuizImportResult);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Import câu hỏi từ Excel</DialogTitle>
          <DialogDescription>
            Nếu bài học chưa có quiz, hệ thống tạo quiz từ sheet Quiz. Nếu đã
            có, các câu hỏi được thêm vào cuối quiz hiện hữu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Alert>
            <FileSpreadsheet className="size-4" />
            <AlertTitle>Mẫu Excel</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Dùng hai sheet <strong>Quiz</strong> và{" "}
                <strong>Questions</strong>. Questions hỗ trợ MCQ và ESSAY; đáp
                án MCQ ghi bằng chữ cái, ví dụ A,C.
              </p>
              <a
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/templates/quiz-import-template.xlsx"
                download
              >
                <Download /> Tải mẫu Excel
              </a>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-dashed p-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
              <Upload className="size-6 text-muted-foreground" />
              <span className="font-medium">
                {file ? file.name : "Chọn tệp .xlsx để import"}
              </span>
              <span className="text-sm text-muted-foreground">Tối đa 2 MB</span>
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={isPending}
              />
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Không thể import</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                {details.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertTitle>Import thành công</AlertTitle>
              <AlertDescription>
                <p className="font-medium">{result.title}</p>
                <p>
                  {result.createdQuiz
                    ? "Đã tạo quiz mới"
                    : "Đã thêm vào quiz hiện hữu"}
                  : {result.questionCount} câu hỏi, tổng {result.totalPoints}{" "}
                  điểm, điểm đạt {result.passScore}%.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            type="button"
            disabled={!file || isPending}
            onClick={handleImport}
          >
            {isPending ? (
              <>
                <Spinner /> Đang import...
              </>
            ) : (
              <>
                <Upload /> Import Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
