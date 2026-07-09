import Image from "next/image";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm">
        <Image
          src="/brand/positivia-logo-dark.png"
          alt="PositivIA"
          width={612}
          height={292}
          className="mx-auto mb-6 h-auto w-full rounded-2xl"
        />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
