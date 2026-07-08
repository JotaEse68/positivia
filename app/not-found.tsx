import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-6">
      <div className="text-center">
        <p className="text-5xl font-bold text-white">404</p>
        <p className="mt-2 text-neutral-400">Esta página no existe.</p>
        <Link href="/" className="mt-4 inline-block text-green-400 underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
