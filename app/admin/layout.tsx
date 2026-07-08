import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

// Layout del área admin. El guard (redirección a login) lo hace middleware.ts
// con Clerk. Aquí pintamos la cabecera con el botón de usuario de Clerk.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-neutral-100">
      {userId && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-lg font-bold text-neutral-900">
                Positiv<span className="text-green-500">IA</span>
              </Link>
              <Link href="/admin/account" className="text-sm text-neutral-500 hover:text-neutral-900">
                Cuenta
              </Link>
            </div>
            <UserButton userProfileUrl="/admin/account" />
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
