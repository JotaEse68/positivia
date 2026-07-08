import PasswordResetForm from "@/components/PasswordResetForm";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Positiv<span className="text-green-400">IA</span>
        </h1>
        <PasswordResetForm />
      </div>
    </main>
  );
}
