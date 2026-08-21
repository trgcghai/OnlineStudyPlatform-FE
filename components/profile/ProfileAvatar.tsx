"use client";

import { useEffect, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useMyProfile, useUploadAvatarForm } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

function getAvatarRejectionMessage(rejections: FileRejection[]): string {
  if (rejections.length > 1) {
    return "Chỉ được chọn 1 ảnh đại diện.";
  }

  const errors = rejections[0]?.errors ?? [];

  if (errors.some((error) => error.code === "file-too-large")) {
    return "Ảnh đại diện phải có dung lượng tối đa 5MB.";
  }

  if (errors.some((error) => error.code === "file-invalid-type")) {
    return "Ảnh đại diện phải là JPEG, PNG, WebP hoặc GIF.";
  }

  if (errors.some((error) => error.code === "too-many-files")) {
    return "Chỉ được chọn 1 ảnh đại diện.";
  }

  return "Không thể chọn ảnh này. Vui lòng thử ảnh khác.";
}

function ProfileAvatar() {
  const { data: profile } = useMyProfile();
  const { uploadAvatar, isPending } = useUploadAvatarForm();
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initials = (profile?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function saveSelectedAvatar() {
    if (!selectedFile) {
      return;
    }

    setError(null);
    const result = await uploadAvatar(selectedFile);

    if (result.ok) {
      setSelectedFile(null);
      setPreviewUrl(null);
    } else {
      setError(result.message ?? null);
    }
  }

  function removeSelectedAvatar(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: AVATAR_ACCEPT,
      disabled: isPending,
      maxFiles: 1,
      maxSize: AVATAR_MAX_SIZE_BYTES,
      multiple: false,
      onDropAccepted: (files) => {
        const file = files[0];

        if (file) {
          setError(null);
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      },
      onDropRejected: (rejections) => {
        const message = getAvatarRejectionMessage(rejections);

        setError(message);
        toast.add({
          title: message,
          type: "error",
        });
      },
    });
  const avatarSrc = previewUrl ?? profile?.avatar ?? undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>
          Chọn ảnh JPEG, PNG, WebP hoặc GIF, tối đa 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div
          {...getRootProps({
            className: cn(
              "group relative flex size-32 cursor-pointer items-center justify-center rounded-full border-2 border-dashed transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isDragActive && "border-primary bg-primary/5",
              isDragReject && "border-destructive bg-destructive/5",
              isPending && "cursor-not-allowed opacity-70",
            ),
          })}
        >
          <input {...getInputProps()} />
          <Avatar className="size-28">
            <AvatarImage src={avatarSrc} alt={profile?.name} />
            <AvatarFallback className="text-2xl">{initials || "?"}</AvatarFallback>
          </Avatar>
          {!selectedFile && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70 text-center text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
              Đổi ảnh
            </div>
          )}
          {selectedFile && (
            <Button
              type="button"
              aria-label="Bỏ ảnh đã chọn"
              onClick={removeSelectedAvatar}
              variant="destructive"
              className="absolute -bottom-1.5 -right-1.5 rounded-full"
              size="icon-sm"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            Kéo thả ảnh vào avatar hoặc bấm vào avatar để chọn file.
          </p>
          <Button
            type="button"
            disabled={!selectedFile || isPending}
            onClick={() => void saveSelectedAvatar()}
          >
            {isPending ? (
              <>
                <Spinner /> Đang lưu...
              </>
            ) : (
              "Lưu ảnh đại diện"
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileAvatar;
