const ADMIN_ROLE_VALUES = new Set(["ADMIN", "SUPER_ADMIN", "STORE_ADMIN"]);

export function isAdminRole(role: unknown): boolean {
  if (typeof role !== "string") {
    return false;
  }

  const normalizedRole = role.trim().toUpperCase();
  return ADMIN_ROLE_VALUES.has(normalizedRole);
}
