"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  ADMIN_NAV_ITEMS,
  isAdminNavigationItemActive,
} from "@/components/admin/admin-navigation";

type AdminSidebarProps = {
  actorName: string;
  roleLabel: string;
  scopeDescription: string;
  scopeLabel: string;
};

const adminIcons = {
  "/admin": LayoutDashboard,
  "/admin/audit": ScrollText,
  "/admin/catalog": Boxes,
  "/admin/customers": Users,
  "/admin/orders": ShoppingCart,
} as const;

function AdminSidebarLink({
  href,
  isActive,
  label,
}: {
  href: string;
  isActive: boolean;
  label: string;
}) {
  const Icon = adminIcons[href as keyof typeof adminIcons] ?? LayoutDashboard;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
        isActive
          ? "bg-[#5c7cfa] text-white shadow-[0_8px_20px_-10px_rgba(92,124,250,0.9)]"
          : "text-[#6a7282] hover:bg-[#5c7cfa]/10 hover:text-[#f1f3f5]"
      }`}
      href={href}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="[font-family:var(--font-arimo)] text-sm font-medium">
        {label}
      </span>
    </Link>
  );
}

export default function AdminSidebar({
  actorName,
  roleLabel,
  scopeLabel,
}: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";

  return (
    <>
      <nav
        aria-label="Navegação administrativa"
        className="overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-max gap-1.5">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = isAdminNavigationItemActive(item.href, pathname);

            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-4 py-2 [font-family:var(--font-arimo)] text-sm font-medium transition ${
                  isActive
                    ? "border-[#5c7cfa]/50 bg-[#5c7cfa]/20 text-[#f1f3f5]"
                    : "border-white/6 bg-[#171a21] text-[#6a7282]"
                }`}
                href={item.href}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden w-full max-w-[240px] shrink-0 lg:block">
        <div className="sticky top-6 space-y-5 rounded-2xl border border-white/6 bg-[#171a21] p-5">
          <div className="flex items-center gap-3 border-b border-white/6 pb-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#12151a]">
              <ShieldCheck className="h-4 w-4 text-[#5c7cfa]" />
            </span>
            <div className="min-w-0">
              <p className="truncate [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5]">
                {actorName}
              </p>
              <p className="truncate [font-family:var(--font-arimo)] text-xs text-[#6a7282]">
                {roleLabel} · {scopeLabel}
              </p>
            </div>
          </div>

          <nav aria-label="Módulos administrativos" className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <AdminSidebarLink
                key={item.href}
                href={item.href}
                isActive={isAdminNavigationItemActive(item.href, pathname)}
                label={item.label}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
