import { describe, expect, it } from "vitest";

import {
  createPasswordPolicyErrorPayload,
  validatePasswordPolicy,
  PASSWORD_POLICY_ERROR_MESSAGE,
  PASSWORD_POLICY_REQUIREMENTS,
} from "@/lib/password-policy";

// ---------------------------------------------------------------------------
// validatePasswordPolicy
// ---------------------------------------------------------------------------

describe("validatePasswordPolicy", () => {
  describe("valid passwords", () => {
    it("accepts a password with all requirements", () => {
      const result = validatePasswordPolicy("Password1!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts a longer password with all requirements", () => {
      const result = validatePasswordPolicy("MyS3cur3P@ssw0rd!");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("accepts a password with each allowed special character", () => {
      const specials = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      for (const char of specials) {
        const result = validatePasswordPolicy(`Passw0rd${char}`);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe("minimum length violation", () => {
    it("rejects empty string", () => {
      const result = validatePasswordPolicy("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
    });

    it("rejects 1 character password", () => {
      const result = validatePasswordPolicy("A1!a");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
    });

    it("rejects 7 character password (just below minimum)", () => {
      const result = validatePasswordPolicy("Abcd1!a");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
    });

    it("accepts exactly 8 character password", () => {
      const result = validatePasswordPolicy("Abcd123!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("uppercase violation", () => {
    it("rejects password with no uppercase letters", () => {
      const result = validatePasswordPolicy("password1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
    });

    it("accepts password with at least one uppercase letter", () => {
      const result = validatePasswordPolicy("Password1!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("lowercase violation", () => {
    it("rejects password with no lowercase letters", () => {
      const result = validatePasswordPolicy("PASSWORD1!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve conter pelo menos uma letra minúscula (a-z)");
    });

    it("accepts password with at least one lowercase letter", () => {
      const result = validatePasswordPolicy("Password1!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("number violation", () => {
    it("rejects password with no digits", () => {
      const result = validatePasswordPolicy("Password!");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve conter pelo menos um número (0-9)");
    });

    it("accepts password with at least one digit", () => {
      const result = validatePasswordPolicy("Password1!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("special character violation", () => {
    it("rejects password with no special characters", () => {
      const result = validatePasswordPolicy("Password123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
    });

    it("rejects password with space as special character", () => {
      const result = validatePasswordPolicy("Password 123");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
    });

    it("accepts password with an allowed special character", () => {
      const result = validatePasswordPolicy("Password1!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("multiple violations", () => {
    it("returns all errors for password missing four requirements", () => {
      const result = validatePasswordPolicy("abcdef");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
      expect(result.errors).toContain("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
      expect(result.errors).toContain("A senha deve conter pelo menos um número (0-9)");
      expect(result.errors).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
    });

    it("returns all errors for password missing all five requirements", () => {
      const result = validatePasswordPolicy("ABCDEF");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("A senha deve ter pelo menos 8 caracteres");
      expect(result.errors).toContain("A senha deve conter pelo menos uma letra minúscula (a-z)");
      expect(result.errors).toContain("A senha deve conter pelo menos um número (0-9)");
      expect(result.errors).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
    });
  });

  describe("edge cases: unicode passwords", () => {
    it("rejects password with only unicode letters and no digits", () => {
      const result = validatePasswordPolicy("Пароль"); // Cyrillic for "password"
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects emoji-only password failing all rules", () => {
      const result = validatePasswordPolicy("😀😀😀😀");
      expect(result.isValid).toBe(false);
    });

    it("handles very long ascii password without crashing", () => {
      const result = validatePasswordPolicy("A".repeat(50) + "a".repeat(50) + "1".repeat(5) + "!");
      expect(result.isValid).toBe(true);
    });
  });

  describe("very long passwords", () => {
    it("accepts very long password with all requirements", () => {
      const longPassword = "A".repeat(100) + "a".repeat(100) + "1".repeat(10) + "!";
      const result = validatePasswordPolicy(longPassword);
      expect(result.isValid).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// createPasswordPolicyErrorPayload
// ---------------------------------------------------------------------------

describe("createPasswordPolicyErrorPayload", () => {
  it("returns structured error for invalid password", () => {
    const payload = createPasswordPolicyErrorPayload("weak");
    expect(payload.message).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.error).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.details).toBeDefined();
    expect(Array.isArray(payload.details)).toBe(true);
    expect(payload.details.length).toBeGreaterThan(0);
  });

  it("returns empty details for valid password", () => {
    const payload = createPasswordPolicyErrorPayload("Valid123!");
    expect(payload.message).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.error).toBe(PASSWORD_POLICY_ERROR_MESSAGE);
    expect(payload.details).toHaveLength(0);
  });

  it("details contain error messages for each failing rule", () => {
    const payload = createPasswordPolicyErrorPayload("onlyletters");
    // "onlyletters" is 10 chars so no minLength error; fails uppercase, number, special char
    expect(payload.details).toContain("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
    expect(payload.details).toContain("A senha deve conter pelo menos um número (0-9)");
    expect(payload.details).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
  });
});

// ---------------------------------------------------------------------------
// PASSWORD_POLICY_REQUIREMENTS
// ---------------------------------------------------------------------------

describe("PASSWORD_POLICY_REQUIREMENTS", () => {
  it("exports exactly 5 requirement messages", () => {
    expect(PASSWORD_POLICY_REQUIREMENTS).toHaveLength(5);
  });

  it("contains all five requirement messages", () => {
    const reqs = PASSWORD_POLICY_REQUIREMENTS;
    expect(reqs).toContain("A senha deve ter pelo menos 8 caracteres");
    expect(reqs).toContain("A senha deve conter pelo menos uma letra maiúscula (A-Z)");
    expect(reqs).toContain("A senha deve conter pelo menos uma letra minúscula (a-z)");
    expect(reqs).toContain("A senha deve conter pelo menos um número (0-9)");
    expect(reqs).toContain("A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)");
  });
});