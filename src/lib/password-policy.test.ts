import { describe, expect, it } from "vitest";
import {
  createPasswordPolicyErrorPayload,
  PASSWORD_POLICY_ERROR_MESSAGE,
  PASSWORD_POLICY_REQUIREMENTS,
  validatePasswordPolicy,
} from "@/lib/password-policy";

describe("password-policy", () => {
  it("exports canonical requirements for UI and API alignment", () => {
    expect(PASSWORD_POLICY_REQUIREMENTS).toEqual([
      "A senha deve ter pelo menos 8 caracteres",
      "A senha deve conter pelo menos uma letra maiúscula (A-Z)",
      "A senha deve conter pelo menos uma letra minúscula (a-z)",
      "A senha deve conter pelo menos um número (0-9)",
      "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
    ]);
  });

  it("accepts a strong password", () => {
    const result = validatePasswordPolicy("StrongPass1!");

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects password that does not satisfy all required rules", () => {
    const result = validatePasswordPolicy("weak");

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "A senha deve ter pelo menos 8 caracteres",
        "A senha deve conter pelo menos uma letra maiúscula (A-Z)",
        "A senha deve conter pelo menos um número (0-9)",
        "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
      ]),
    );
  });

  it("builds a consistent error payload", () => {
    const payload = createPasswordPolicyErrorPayload("weak");

    expect(payload.message).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.error).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.details).toHaveLength(4);
  });
});
