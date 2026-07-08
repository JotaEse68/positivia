import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Rutas que exigen sesión de Clerk. La página de login (/admin/login) y las
// rutas públicas (landing /r, /api/feedback, /api/qr, notificaciones internas)
// quedan fuera.
const isProtected = createRouteMatcher([
  "/admin/dashboard(.*)",
  "/admin/account(.*)",
  "/superadmin(.*)",
  "/api/superadmin(.*)",
  "/api/complaint(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Todas las rutas salvo estáticos e internos de Next.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
