export const PASSWORD_POLICY_ERROR_MESSAGE =
  "Senha não atende aos requisitos de segurança";

// AIDEV-CRITICAL: Shared policy for password validation in register/reset backend flows.
const PASSWORD_SPECIAL_CHARACTER_PATTERN =
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const PASSWORD_POLICY_RULE_ERRORS = {
  minLength: "A senha deve ter pelo menos 8 caracteres",
  uppercase: "A senha deve conter pelo menos uma letra maiúscula (A-Z)",
  lowercase: "A senha deve conter pelo menos uma letra minúscula (a-z)",
  number: "A senha deve conter pelo menos um número (0-9)",
  specialCharacter:
    "A senha deve conter pelo menos um caractere especial (!@#$%^&*()_+-=[]{}|;':\",./<>?)",
} as const;

export type PasswordPolicyValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type PasswordPolicyErrorPayload = {
  message: string;
  error: string;
  details: string[];
};

export function validatePasswordPolicy(
  password: string,
): PasswordPolicyValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(PASSWORD_POLICY_RULE_ERRORS.minLength);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(PASSWORD_POLICY_RULE_ERRORS.uppercase);
  }

  if (!/[a-z]/.test(password)) {
    errors.push(PASSWORD_POLICY_RULE_ERRORS.lowercase);
  }

  if (!/\d/.test(password)) {
    errors.push(PASSWORD_POLICY_RULE_ERRORS.number);
  }

  if (!PASSWORD_SPECIAL_CHARACTER_PATTERN.test(password)) {
    errors.push(PASSWORD_POLICY_RULE_ERRORS.specialCharacter);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createPasswordPolicyErrorPayload(
  password: string,
): PasswordPolicyErrorPayload {
  const validation = validatePasswordPolicy(password);

  return {
    message: PASSWORD_POLICY_ERROR_MESSAGE,
    error: PASSWORD_POLICY_ERROR_MESSAGE,
    details: validation.errors,
  };
}
