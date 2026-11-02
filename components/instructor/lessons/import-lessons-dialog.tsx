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
import { useImportInstructorLessons } from "@/hooks/useInstructorLessons";
import type { LessonImportResult } from "@/services/api/lessons";
import Link from "next/link";
import { cn } from "@/lib/utils";

const MAX_IMPORT_SIZE = 1024 * 1024 * 1024;

function getFileRejectionMessage(rejections: FileRejection[]): string {
  const errors = rejections[0]?.errors ?? [];

  if (
    rejections.length > 1 ||
    errors.some((error) => error.code === "too-many-files")
  ) {
    return "Chỉ được chọn 1 tệp .zip hoặc .rar.";
  }

  if (errors.some((error) => error.code === "file-too-large")) {
    return "Gói bài học không được vượt quá 1 GB.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return "Chỉ hỗ trợ gói bài học có định dạng .zip hoặc .rar.";
  }

  return "Không thể chọn tệp này. Vui lòng thử tệp khác.";
}

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [result, setResult] = useState<LessonImportResult | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const { importInstructorLessons, cancelImport, isPending, stage, progress } =
    useImportInstructorLessons();

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

    if (nextFile && !/\.(zip|rar)$/i.test(nextFile.name)) {
      setFile(null);
      setError("Chỉ hỗ trợ gói bài học có định dạng .zip hoặc .rar.");
      return;
    }

    if (nextFile && nextFile.size > MAX_IMPORT_SIZE) {
      setFile(null);
      setError("Gói bài học không được vượt quá 1 GB.");
      return;
    }

    setFile(nextFile);
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "application/zip": [".zip"],
        "application/vnd.rar": [".rar"],
        "application/x-rar-compressed": [".rar"],
      },
      disabled: isPending,
      maxFiles: 1,
      maxSize: MAX_IMPORT_SIZE,
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
      setError("Hãy chọn một tệp .zip hoặc .rar trước khi import.");
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
    setInputKey((key) => key + 1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Import nhiều bài học từ ZIP/RAR</DialogTitle>
          <DialogDescription>
            Các bài học mới được thêm vào cuối khóa học. Cột order trong Excel
            quyết định thứ tự giữa các bài vừa import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Alert>
            <AlertTitle>Hướng dẫn import</AlertTitle>
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
              <Link
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "no-underline!",
                )}
                href="/templates/lesson-import-template.zip"
                download
              >
                <Download /> Tải mẫu ZIP
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
              {file ? file.name : "Kéo thả tệp .zip/.rar hoặc bấm để chọn"}
            </span>
            <span className="text-sm text-muted-foreground">
              Tối đa 1 GB · Video MP4/WebM/MKV · Tài liệu PDF/DOCX/PPTX
            </span>
          </div>

          {isPending && (
            <div className="space-y-2" aria-live="polite">
              <div className="flex justify-between gap-4 text-sm">
                <span>
                  {stage === "preparing" && "Đang tạo phiên tải lên..."}
                  {stage === "uploading" &&
                    "Đang tải gói import trực tiếp lên kho tệp..."}
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
                <Upload /> Import ZIP/RAR
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
