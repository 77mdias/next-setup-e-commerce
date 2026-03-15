"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

import { isAdminRole } from "@/lib/admin-role";

export function useAuth() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session?.user,
    isAdmin: isAdminRole(role),
    isSeller: role === UserRole.SELLER,
    isCustomer: role === UserRole.CUSTOMER,
    isStoreAdmin: role === UserRole.STORE_ADMIN,
    isSuperAdmin: role === UserRole.SUPER_ADMIN,
    session,
    status,
  };
}
