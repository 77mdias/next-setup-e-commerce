import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      phone?: number | null;
      image?: string | null;
      role: UserRole;
      cpf?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    phone?: number | null;
    image?: string | null;
    role: UserRole;
    cpf?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    phone?: number | null;
    cpf?: string | null;
  }
}
