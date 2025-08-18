import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@prisma/client";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Authentication required");
  }
  return session.user;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Role ${role} required`);
  }
  return user;
}

export async function requireAdmin() {
  return await requireRole(UserRole.ADMIN);
}

export async function requireSeller() {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SELLER) {
    throw new Error("Seller or Admin role required");
  }
  return user;
}
