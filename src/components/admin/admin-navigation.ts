import { ROUTE_PATHS } from "@/lib/routes";

export type AdminNavItem = {
  description: string;
  eyebrow: string;
  heading: string;
  href: string;
  label: string;
  shortLabel: string;
};

export type AdminBreadcrumb = {
  href: string;
  label: string;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    description:
      "Entrada única para acompanhar indicadores, risco operacional e próximos passos do painel.",
    eyebrow: "Dashboard",
    heading: "Dashboard administrativo",
    href: ROUTE_PATHS.admin,
    label: "Dashboard",
    shortLabel: "Dashboard",
  },
  {
    description:
      "Acompanhe a fila operacional de pedidos, pagamentos e exceções antes das ações do módulo dedicado.",
    eyebrow: "Pedidos",
    heading: "Pedidos administrativos",
    href: ROUTE_PATHS.adminOrders,
    label: "Pedidos",
    shortLabel: "Pedidos",
  },
  {
    description:
      "Centralize a gestão operacional de catálogo, estoque e mídia dos produtos da operação.",
    eyebrow: "Catálogo",
    heading: "Catálogo administrativo",
    href: ROUTE_PATHS.adminCatalog,
    label: "Catálogo",
    shortLabel: "Catálogo",
  },
  {
    description:
      "Consolide a visão administrativa dos clientes com foco em atendimento e histórico operacional.",
    eyebrow: "Clientes",
    heading: "Clientes administrativos",
    href: ROUTE_PATHS.adminCustomers,
    label: "Clientes",
    shortLabel: "Clientes",
  },
  {
    description:
      "Monitore trilhas sensíveis e eventos administrativos críticos com contexto auditável.",
    eyebrow: "Auditoria",
    heading: "Auditoria administrativa",
    href: ROUTE_PATHS.adminAudit,
    label: "Auditoria",
    shortLabel: "Auditoria",
  },
] as const;

function normalizeAdminPath(pathname: string): string {
  if (!pathname) {
    return ROUTE_PATHS.admin;
  }

  if (pathname !== ROUTE_PATHS.admin && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function isAdminNavigationItemActive(
  href: string,
  pathname: string,
): boolean {
  const normalizedPath = normalizeAdminPath(pathname);

  if (href === ROUTE_PATHS.admin) {
    return normalizedPath === ROUTE_PATHS.admin;
  }

  return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
}

export function getAdminRouteMeta(pathname: string): AdminNavItem {
  const normalizedPath = normalizeAdminPath(pathname);

  return (
    ADMIN_NAV_ITEMS.find((item) =>
      isAdminNavigationItemActive(item.href, normalizedPath),
    ) ?? ADMIN_NAV_ITEMS[0]
  );
}

export function getAdminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  const route = getAdminRouteMeta(pathname);

  if (route.href === ROUTE_PATHS.admin) {
    return [{ href: route.href, label: route.label }];
  }

  return [
    { href: ROUTE_PATHS.admin, label: "Dashboard" },
    { href: route.href, label: route.label },
  ];
}
