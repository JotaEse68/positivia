import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";

// Layout del área admin. El guard real (redirección) lo hace middleware.ts;
// aquí solo pintamos la cabecera con el usuario cuando hay sesión.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-100">
      {user && (
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/admin/dashboard" className="text-lg font-bold text-neutral-900">
              Positiv<span className="text-green-500">IA</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-neutral-500 sm:inline">{user.email}</span>
              <form action="/admin/auth/signout" method="post">
                <button className="rounded-lg border px-3 py-1.5 text-neutral-700 hover:bg-neutral-50">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
