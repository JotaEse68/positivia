import Link from "next/link";
import Image from "next/image";
import { Fraunces } from "next/font/google";
import LogoutButton from "@/components/LogoutButton";
import { createServerSupabase } from "@/lib/supabase-server";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

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
    <div className={`${display.variable} min-h-screen bg-[#FFF9EA]`}>
      {user && (
        <header className="border-b border-[#102D2A]/10 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-bold text-[#102D2A]">
                <Image
                  src="/brand/positivia-app-icon.png"
                  alt="PositivIA"
                  width={96}
                  height={96}
                  className="h-9 w-9 rounded-xl object-cover"
                />
                <span>Positiv<span className="text-[#27765B]">IA</span></span>
              </Link>
              <Link href="/admin/dashboard" className="text-sm text-[#53655E] hover:text-[#102D2A]">
                Quejas
              </Link>
              <Link href="/admin/qr" className="text-sm text-[#53655E] hover:text-[#102D2A]">
                Mi QR
              </Link>
              <Link href="/admin/experience" className="text-sm text-[#53655E] hover:text-[#102D2A]">
                Configurar QR
              </Link>
              <Link href="/admin/account" className="text-sm text-[#53655E] hover:text-[#102D2A]">
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
