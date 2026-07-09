import Image from "next/image";
import PasswordResetForm from "@/components/PasswordResetForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const query = await searchParams;
  const initialMode = query.mode === "update" ? "update" : "request";

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md">
        <Image
          src="/brand/positivia-logo-dark.png"
          alt="PositivIA"
          width={612}
          height={292}
          className="mx-auto mb-6 h-auto w-full max-w-sm rounded-2xl"
        />
        <PasswordResetForm initialMode={initialMode} />
      </div>
    </main>
  );
}
