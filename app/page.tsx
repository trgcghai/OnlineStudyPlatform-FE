import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
        Nền tảng học trực tuyến thông minh
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Khám phá các khóa học trực tuyến với hỗ trợ AI cá nhân hóa lộ trình của
        bạn.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/courses" className={buttonVariants({ size: "lg" })}>
          Khám phá khóa học
        </Link>
        <Link
          href="/signin"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Đăng nhập
        </Link>
      </div>
    </section>
  );
}