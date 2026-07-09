import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-100">
      {user && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-lg font-bold text-neutral-900">
                Positiv<span className="text-green-500">IA</span>
              </Link>
              <Link href="/admin/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
                Quejas
              </Link>
              <Link href="/admin/experience" className="text-sm text-neutral-500 hover:text-neutral-900">
                Configurar QR
              </Link>
              <Link href="/admin/account" className="text-sm text-neutral-500 hover:text-neutral-900">
                Cuenta
              </Link>
            </div>
            <LogoutButton />
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
