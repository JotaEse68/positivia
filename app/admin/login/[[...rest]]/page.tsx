import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

// Login con Clerk. Al autenticarse, redirige al dashboard del dueño.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-3xl font-bold text-white">
          Positiv<span className="text-green-400">IA</span>
        </h1>
        <SignIn
          routing="path"
          path="/admin/login"
          signUpUrl="/admin/login"
          fallbackRedirectUrl="/admin/dashboard"
          appearance={{
            variables: { colorPrimary: "#16a34a" },
          }}
        />
        <p className="mt-4 text-center text-sm text-neutral-400">
          ¿No recuerdas la contraseña?{" "}
          <Link href="/admin/reset-password" className="text-green-400 underline">
            Cambiarla por email
          </Link>
        </p>
      </div>
    </main>
  );
}
