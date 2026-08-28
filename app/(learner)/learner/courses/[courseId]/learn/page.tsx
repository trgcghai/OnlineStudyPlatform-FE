import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LearningPlayerClient } from "./learning-player-client";

interface LearningPlayerPageProps {
  params: Promise<{ courseId: string }>;
}

function LearningPlayerFallback() {
  return (
    <div className="container grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-96 rounded-3xl" />
      <Skeleton className="h-[520px] rounded-3xl" />
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
