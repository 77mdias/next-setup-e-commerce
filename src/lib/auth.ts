import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // OAuth Providers
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.CUSTOMER,
        };
      },
    }),
    // Credentials Provider para login com email/senha
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Verificar se o usuário está ativo
        if (!user.isActive) {
          throw new Error("EmailNotVerified");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          cpf: user.cpf,
          image: (user as any).image || (user as any).avatar || null,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // Atualiza a cada 24h
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.cpf = (user as any).cpf || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.cpf = token.cpf as string;
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Para login OAuth (Google, GitHub)
      if (account?.provider !== "credentials") {
        // Verificar se já existe um usuário com este email
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
          include: {
            accounts: true,
          },
        });

        if (existingUser) {
          // Se o usuário existe mas não tem provider OAuth configurado
          if (!existingUser.accounts || existingUser.accounts.length === 0) {
            throw new Error("OAuthAccountNotLinked");
          }

          // Verificar se o provider está vinculado
          const hasProvider = existingUser.accounts.some(
            (acc) => acc.provider === account?.provider,
          );

          if (!hasProvider) {
            // Retornar false para que o NextAuth redirecione para a página de erro
            // O NextAuth automaticamente adicionará o erro na URL
            console.log(
              "Provider não vinculado, retornando false para redirecionar para erro",
            );
            return false;
          }
        }

        return true;
      }

      // Para credentials, verificar se o usuário está ativo
      const dbUser = await db.user.findUnique({
        where: { email: user.email! },
      });

      return dbUser?.isActive ?? false;
    },
    async redirect({ url, baseUrl }) {
      // Se a URL é relativa, adiciona o baseUrl
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        return redirectUrl;
      }

      // Se a URL é do mesmo domínio, permite
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Se a URL contém callbackUrl, extrai e usa
      if (url.includes("callbackUrl=")) {
        const urlObj = new URL(url);
        const callbackUrl = urlObj.searchParams.get("callbackUrl");
        if (callbackUrl) {
          const finalUrl = callbackUrl.startsWith("/")
            ? `${baseUrl}${callbackUrl}`
            : callbackUrl;
          return finalUrl;
        }
      }

      // Se não, volta para o baseUrl
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // Redirecionar para página de erro dedicada
    signOut: "/", // Redirecionar para home após logout
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helpers para server-side
export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
};
