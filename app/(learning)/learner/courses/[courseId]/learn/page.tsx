import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LearningPlayerClient } from "./learning-player-client";

interface LearningPlayerPageProps {
  params: Promise<{ courseId: string }>;
}

function LearningPlayerFallback() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
        </div>
        <Skeleton className="h-96 w-full lg:w-[26rem]" />
      </div>
    </div>
  );
}

export default async function LearningPlayerPage({
  params,
}: LearningPlayerPageProps) {
  const { courseId } = await params;

  return (
    <Suspense fallback={<LearningPlayerFallback />}>
      <LearningPlayerClient courseId={courseId} />
    </Suspense>
  );
}
