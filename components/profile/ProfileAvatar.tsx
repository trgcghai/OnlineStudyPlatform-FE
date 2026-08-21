"use client";
import { useState } from "react";
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

  const initials = (profile?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function uploadSelectedAvatar(file: File) {
    setError(null);
    const result = await uploadAvatar(file);

    if (!result.ok) {
      setError(result.message ?? null);
    }
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
          void uploadSelectedAvatar(file);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>
          Chọn ảnh JPEG, PNG, WebP hoặc GIF, tối đa 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent
        {...getRootProps({
          className: cn(
            "flex cursor-pointer items-center gap-4 rounded-b-xl border-t border-dashed p-6 transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isDragActive && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            isPending && "cursor-not-allowed opacity-70",
          ),
        })}
      >
        <input {...getInputProps()} />
        <Avatar className="size-16">
          <AvatarImage src={profile?.avatar ?? undefined} alt={profile?.name} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner /> Đang tải lên...
              </>
            ) : (
              "Chọn ảnh"
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            Kéo thả ảnh vào đây hoặc bấm để chọn file.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileAvatar;
