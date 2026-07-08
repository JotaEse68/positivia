import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">
          Contraseña y seguridad
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Gestiona contraseña, emails, métodos de acceso y sesiones. Si no
          recuerdas la contraseña actual, usa el método alternativo de
          verificación que muestra Clerk.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white p-2">
        <UserProfile
          routing="path"
          path="/admin/account"
          appearance={{
            variables: { colorPrimary: "#16a34a" },
            elements: {
              cardBox: "shadow-none",
              navbar: "bg-white",
            },
          }}
        />
      </div>
    </main>
  );
}
