import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin");
    const isProfilePage = req.nextUrl.pathname.includes("/perfil");
    const isWishlistPage = req.nextUrl.pathname.includes("/wishlist");
    const isCartPage = req.nextUrl.pathname.includes("/carrinho");

    // Redirecionar usuários autenticados das páginas de auth
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Proteger páginas que requerem autenticação
    if (!isAuth && (isProfilePage || isWishlistPage || isCartPage)) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Proteger páginas de admin
    if (isAdminPage && (!isAuth || token?.role !== "ADMIN")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // Deixar o middleware handle a lógica
    },
  },
);

export const config = {
  matcher: [
    // Proteger todas as rotas exceto as públicas
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    // Proteger especificamente as rotas de auth
    "/auth/:path*",
    // Proteger rotas que requerem login
    "/:slug/perfil/:path*",
    "/:slug/wishlist/:path*",
    "/:slug/carrinho/:path*",
    // Proteger rotas de admin
    "/admin/:path*",
  ],
};
