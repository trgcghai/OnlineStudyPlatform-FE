"use client";

import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
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
import Link from "next/link";
import { cn } from "@/lib/utils";

function getFileRejectionMessage(rejections: FileRejection[]): string {
  const errors = rejections[0]?.errors ?? [];

  if (
    rejections.length > 1 ||
    errors.some((error) => error.code === "too-many-files")
  ) {
    return "Chỉ được chọn 1 tệp .xlsx.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return "Chỉ hỗ trợ tệp Excel có định dạng .xlsx.";
  }

  return "Không thể chọn tệp này. Vui lòng thử tệp khác.";
}

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<QuizImportResult | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const { importInstructorQuiz, isPending } = useImportInstructorQuiz();

  function resetState() {
    setFile(null);
    setError(null);
    setDetails([]);
    setResult(null);
    setInputKey((key) => key + 1);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    if (!nextOpen) resetState();
    onOpenChange(nextOpen);
  }

  function handleFileSelect(nextFile: File | null) {
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

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      disabled: isPending,
      maxFiles: 1,
      multiple: false,
      onDropAccepted: (files) => handleFileSelect(files[0] ?? null),
      onDropRejected: (rejections) => {
        setFile(null);
        setResult(null);
        setDetails([]);
        setError(getFileRejectionMessage(rejections));
      },
    });

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
    setInputKey((key) => key + 1);
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
            <AlertTitle>Hướng dẫn import</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Dùng hai sheet <strong>Quiz</strong> và{" "}
                <strong>Questions</strong>. Questions hỗ trợ MCQ và ESSAY; đáp
                án MCQ ghi bằng chữ cái, ví dụ A,C.
              </p>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "no-underline!",
                )}
                href="/templates/quiz-import-template.xlsx"
                download
              >
                <Download /> Tải mẫu Excel
              </Link>
            </AlertDescription>
          </Alert>

          <div
            {...getRootProps({
              className: cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center outline-none transition-colors",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isDragActive && "border-primary bg-primary/5",
                isDragReject && "border-destructive bg-destructive/5",
                isPending && "cursor-not-allowed opacity-70",
              ),
            })}
          >
            <input key={inputKey} {...getInputProps()} />
            <Upload className="size-6 text-muted-foreground" />
            <span className="font-medium">
              {file ? file.name : "Kéo thả tệp .xlsx hoặc bấm để chọn"}
            </span>
            <span className="text-sm text-muted-foreground">Tối đa 2 MB</span>
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
