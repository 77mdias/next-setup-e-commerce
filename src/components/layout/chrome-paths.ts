import { ROUTE_PATHS } from "@/lib/routes";

export function shouldRenderPublicChrome(pathname: string): boolean {
  return !(
    pathname === ROUTE_PATHS.admin ||
    pathname.startsWith(`${ROUTE_PATHS.admin}/`)
  );
}
