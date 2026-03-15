import { describe, expect, it } from "vitest";

import { shouldRenderPublicChrome } from "@/components/layout/chrome-paths";

describe("chrome path guards", () => {
  it("hides public chrome for admin shell routes", () => {
    expect(shouldRenderPublicChrome("/admin")).toBe(false);
    expect(shouldRenderPublicChrome("/admin/orders")).toBe(false);
  });

  it("keeps public chrome for non-admin routes", () => {
    expect(shouldRenderPublicChrome("/products")).toBe(true);
    expect(shouldRenderPublicChrome("/loja/admin/remove-bg")).toBe(true);
  });
});
