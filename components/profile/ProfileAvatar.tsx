"use client";

import { useRef, useState } from "react";
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
import { useMyProfile, useUploadAvatarForm } from "@/hooks/useUsers";

function ProfileAvatar() {
  const { data: profile } = useMyProfile();
  const { uploadAvatar, isPending } = useUploadAvatarForm();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    const result = await uploadAvatar(file);

    if (!result.ok) {
      setError(result.message ?? null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ảnh đại diện</CardTitle>
        <CardDescription>
          Chọn ảnh JPEG, PNG, WebP hoặc GIF, tối đa 5MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={profile?.avatar ?? undefined} alt={profile?.name} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={onFileSelected}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isPending ? (
              <>
                <Spinner /> Đang tải lên...
              </>
            ) : (
              "Chọn ảnh"
            )}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileAvatar;
