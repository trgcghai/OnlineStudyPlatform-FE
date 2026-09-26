"use client";

import { Download, FileArchive, Upload } from "lucide-react";
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
import { useImportInstructorLessons } from "@/hooks/useInstructorLessons";
import type { LessonImportResult } from "@/services/api/lessons";

const MAX_ZIP_SIZE = 1024 * 1024 * 1024;

interface ImportLessonsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function ImportLessonsDialog({
  open,
  onOpenChange,
  courseId,
}: ImportLessonsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<LessonImportResult | null>(null);
  const { importInstructorLessons, cancelImport, isPending, stage, progress } =
    useImportInstructorLessons();

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

    if (nextFile && !nextFile.name.toLowerCase().endsWith(".zip")) {
      setFile(null);
      setError("Chỉ hỗ trợ gói bài học có định dạng .zip.");
      return;
    }

    if (nextFile && nextFile.size > MAX_ZIP_SIZE) {
      setFile(null);
      setError("Gói bài học không được vượt quá 1 GB.");
      return;
    }

    setFile(nextFile);
  }

  async function handleImport() {
    if (!file) {
      setError("Hãy chọn một tệp .zip trước khi import.");
      return;
    }

    setError(null);
    setDetails([]);
    const importResult = await importInstructorLessons(courseId, file);
    if (!importResult.ok) {
      setError(importResult.message ?? "Không thể import bài học.");
      setDetails(importResult.details ?? []);
      return;
    }

    setResult(importResult.data ?? null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Import nhiều bài học từ ZIP</DialogTitle>
          <DialogDescription>
            Các bài học mới được thêm vào cuối khóa học. Cột order trong Excel
            quyết định thứ tự giữa các bài vừa import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Alert>
            <FileArchive className="size-4" />
            <AlertTitle>Cấu trúc gói import</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Đặt <strong>lessons.xlsx</strong> ở thư mục gốc; video trong
                <strong> videos/</strong> và tài liệu trong
                <strong> materials/</strong>. Mỗi bài có tối đa một video và một
                tài liệu.
              </p>
              <p>
                Tải và giải nén gói mẫu, sửa <strong>lessons.xlsx</strong>, thêm
                tệp vào hai thư mục tương ứng rồi nén trực tiếp ba thành phần
                bên dưới. Không nén kèm thư mục cha.
              </p>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {`course-lessons.zip
├─ lessons.xlsx
├─ videos/lesson-1.mp4
└─ materials/lesson-1.pdf`}
              </pre>
              <a
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/templates/lesson-import-template.zip"
                download
              >
                <Download /> Tải mẫu ZIP
              </a>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-dashed p-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
              <Upload className="size-6 text-muted-foreground" />
              <span className="font-medium">
                {file ? file.name : "Chọn tệp .zip để import"}
              </span>
              <span className="text-sm text-muted-foreground">
                Tối đa 1 GB · Video MP4/WebM · Tài liệu PDF/DOCX/PPTX
              </span>
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept=".zip,application/zip"
                onChange={handleFileChange}
                disabled={isPending}
              />
            </label>
          </div>

          {isPending && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex justify-between gap-4 text-sm">
                <span>
                  {stage === "preparing" && "Đang tạo phiên tải lên..."}
                  {stage === "uploading" &&
                    "Đang tải ZIP trực tiếp lên kho tệp..."}
                  {stage === "queued" && "Đang chờ xử lý..."}
                  {stage === "processing" && "Đang kiểm tra và tạo bài học..."}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Không thể import</AlertTitle>
              <AlertDescription>
                <p>{error}</p>
                {details.length > 0 && (
                  <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
                    {details.map((detail, index) => (
                      <li key={`${index}-${detail}`}>{detail}</li>
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
                Đã tạo {result.createdLessonCount} bài học ở vị trí từ
                {` ${(result.firstPosition ?? 0) + 1}`} đến
                {` ${(result.lastPosition ?? 0) + 1}`}.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {isPending && stage === "uploading" && (
            <Button type="button" variant="destructive" onClick={cancelImport}>
              Hủy tải lên
            </Button>
          )}
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
                <Upload /> Import ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
