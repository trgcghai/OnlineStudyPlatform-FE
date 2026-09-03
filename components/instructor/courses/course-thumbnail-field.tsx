"use client";

import { useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  COURSE_THUMBNAIL_ACCEPT,
  COURSE_THUMBNAIL_MAX_SIZE_BYTES,
} from "@/lib/schemas/course";

interface CourseThumbnailFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
  disabled?: boolean;
}

function getThumbnailRejectionMessage(rejections: FileRejection[]): string {
  if (rejections.length > 1) return "Chỉ được chọn 1 ảnh khóa học.";

  const errors = rejections[0]?.errors ?? [];

  if (errors.some((error) => error.code === "file-too-large")) {
    return "Ảnh khóa học phải có dung lượng tối đa 5MB.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return "Ảnh khóa học phải là JPEG, PNG, WebP hoặc GIF.";
  }

  if (errors.some((error) => error.code === "too-many-files")) {
    return "Chỉ được chọn 1 ảnh khóa học.";
  }

  return "Không thể chọn ảnh này. Vui lòng thử ảnh khác.";
}

export function CourseThumbnailField({
  value,
  onChange,
  currentUrl,
  disabled,
}: CourseThumbnailFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function replaceThumbnail(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    onChange(file);
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: COURSE_THUMBNAIL_ACCEPT,
      disabled,
      maxFiles: 1,
      maxSize: COURSE_THUMBNAIL_MAX_SIZE_BYTES,
      multiple: false,
      onDropAccepted: (files) => replaceThumbnail(files[0] ?? null),
      onDropRejected: (rejections) => {
        const message = getThumbnailRejectionMessage(rejections);
        toast.add({ title: message, type: "error" });
      },
    });

  const imageUrl = previewUrl ?? currentUrl ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps({
          className: cn(
            "group relative flex min-h-52 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/30 outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isDragActive && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            disabled && "cursor-not-allowed opacity-70",
          ),
        })}
      >
        <input {...getInputProps()} />
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Ảnh khóa học"
            className="h-full min-h-52 w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <ImagePlus className="size-8" aria-hidden="true" />
            <span>Kéo thả ảnh hoặc bấm để chọn ảnh khóa học</span>
            <span>JPEG, PNG, WebP hoặc GIF, tối đa 5MB</span>
          </div>
        )}
        {value && (
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute right-3 top-3 rounded-full"
            disabled={disabled}
            aria-label="Bỏ ảnh đã chọn"
            onClick={(event) => {
              event.stopPropagation();
              replaceThumbnail(null);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
