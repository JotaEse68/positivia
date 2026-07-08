import { currentUser } from "@clerk/nextjs/server";

// Devuelve el usuario de Clerk si es el superadmin (su email coincide con
// SUPERADMIN_EMAIL), o null. SUPERADMIN_EMAIL nunca se expone al cliente.
export async function getSuperadmin() {
  const superEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (!superEmail) return null;

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
  if (!email || email !== superEmail) return null;

  return user;
}
