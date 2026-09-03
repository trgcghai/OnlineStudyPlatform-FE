"use client";

import { useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  LESSON_MATERIAL_ACCEPT,
  LESSON_MATERIAL_MAX_SIZE_BYTES,
  LESSON_VIDEO_ACCEPT,
  LESSON_VIDEO_MAX_SIZE_BYTES,
} from "@/lib/schemas/lesson";

interface LessonFileFieldProps {
  label: string;
  type: "video" | "material";
  value: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
  disabled?: boolean;
}

function getAcceptMap(type: "video" | "material") {
  return type === "video" ? LESSON_VIDEO_ACCEPT : LESSON_MATERIAL_ACCEPT;
}

function getMaxSize(type: "video" | "material") {
  return type === "video"
    ? LESSON_VIDEO_MAX_SIZE_BYTES
    : LESSON_MATERIAL_MAX_SIZE_BYTES;
}

function getAcceptDescription(type: "video" | "material") {
  return type === "video"
    ? "MP4, WebM (tối đa 200MB)"
    : "PDF, DOCX, PPTX (tối đa 20MB)";
}

function getFileRejectionMessage(
  rejections: FileRejection[],
  type: "video" | "material",
): string {
  if (rejections.length > 1) return "Chỉ được chọn 1 file.";

  const errors = rejections[0]?.errors ?? [];

  if (errors.some((error) => error.code === "file-too-large")) {
    return type === "video"
      ? "File video phải có dung lượng tối đa 200MB."
      : "File tài liệu phải có dung lượng tối đa 20MB.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return type === "video"
      ? "Video phải là file MP4 hoặc WebM."
      : "Tài liệu phải là PDF, DOCX hoặc PPTX.";
  }

  return "Không thể chọn file này. Vui lòng thử file khác.";
}

function getFileNameFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1] || url;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LessonFileField({
  label,
  type,
  value,
  onChange,
  currentUrl,
  disabled,
}: LessonFileFieldProps) {
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      setPreviewName(null);
      setPreviewSize(null);
    };
  }, []);

  function replaceFile(file: File | null) {
    setPreviewName(file ? file.name : null);
    setPreviewSize(file ? file.size : null);
    onChange(file);
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: getAcceptMap(type),
      disabled,
      maxFiles: 1,
      maxSize: getMaxSize(type),
      multiple: false,
      onDropAccepted: (files) => replaceFile(files[0] ?? null),
      onDropRejected: (rejections) => {
        const message = getFileRejectionMessage(rejections, type);
        toast.add({ title: message, type: "error" });
      },
    });

  const Icon = type === "video" ? Film : FileText;
  const hasFile = value || currentUrl;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div
        {...getRootProps({
          className: cn(
            "group relative flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-4 outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isDragActive && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            disabled && "cursor-not-allowed opacity-70",
          ),
        })}
      >
        <input {...getInputProps()} />
        {hasFile ? (
          <div className="flex items-center gap-3">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {previewName ??
                  (currentUrl ? getFileNameFromUrl(currentUrl) : "")}
              </span>
              {previewSize !== null && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(previewSize)}
                </span>
              )}
              {currentUrl && !previewName && (
                <span className="text-xs text-muted-foreground">Hiện tại</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
            <Icon className="size-6" aria-hidden="true" />
            <span>Kéo thả file hoặc bấm để chọn</span>
            <span className="text-xs">{getAcceptDescription(type)}</span>
          </div>
        )}
        {value && (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute right-2 top-2 rounded-full"
            disabled={disabled}
            aria-label="Bỏ file đã chọn"
            onClick={(event) => {
              event.stopPropagation();
              replaceFile(null);
            }}
          >
            <X className="size-3" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
