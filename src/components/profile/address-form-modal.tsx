"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";

export type AddressFormValues = {
  city: string;
  complement: string;
  country: string;
  isDefault: boolean;
  label: string;
  neighborhood: string;
  number: string;
  state: string;
  street: string;
  zipCode: string;
};

type AddressFormMode = "create" | "edit";

type AddressFormErrors = Partial<
  Record<Exclude<keyof AddressFormValues, "isDefault">, string>
>;

type AddressFormModalProps = {
  initialValues: AddressFormValues;
  isOpen: boolean;
  isSubmitting: boolean;
  mode: AddressFormMode;
  onClose: () => void;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  submitError?: string | null;
};

const ZIP_CODE_REGEX = /^\d{5}-?\d{3}$/;

const inputClassName =
  "h-10 w-full rounded-xl border border-[#dbe4ff] bg-[#f8faff] px-3 text-sm text-[#0f172a] outline-none transition-colors focus:border-[#5C7CFA] dark:border-white/[0.08] dark:bg-[#12151A] dark:text-[#F1F3F5]";

export const EMPTY_ADDRESS_FORM_VALUES: AddressFormValues = {
  city: "",
  complement: "",
  country: "Brasil",
  isDefault: false,
  label: "",
  neighborhood: "",
  number: "",
  state: "",
  street: "",
  zipCode: "",
};

function formatZipCodeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function validateAddress(values: AddressFormValues): AddressFormErrors {
  const errors: AddressFormErrors = {};

  if (!values.label.trim()) {
    errors.label = "Rótulo é obrigatório";
  }

  if (!values.street.trim()) {
    errors.street = "Rua é obrigatória";
  }

  if (!values.number.trim()) {
    errors.number = "Número é obrigatório";
  }

  if (!values.neighborhood.trim()) {
    errors.neighborhood = "Bairro é obrigatório";
  }

  if (!values.city.trim()) {
    errors.city = "Cidade é obrigatória";
  }

  const normalizedState = values.state.trim();
  if (normalizedState.length < 2 || normalizedState.length > 3) {
    errors.state = "Estado deve ter entre 2 e 3 caracteres";
  }

  const normalizedZipCode = values.zipCode.trim();
  if (!ZIP_CODE_REGEX.test(normalizedZipCode)) {
    errors.zipCode = "CEP deve estar no formato 00000-000";
  }

  const normalizedCountry = values.country.trim();
  if (normalizedCountry.length > 0 && normalizedCountry.length < 2) {
    errors.country = "País deve ter ao menos 2 caracteres";
  }

  return errors;
}

export function AddressFormModal({
  initialValues,
  isOpen,
  isSubmitting,
  mode,
  onClose,
  onSubmit,
  submitError,
}: AddressFormModalProps) {
  const [formValues, setFormValues] =
    useState<AddressFormValues>(initialValues);
  const [errors, setErrors] = useState<AddressFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(initialValues);
    setErrors({});
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<K extends keyof AddressFormValues>(
    field: K,
    value: AddressFormValues[K],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((currentErrors) => {
      if (field === "isDefault") {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      const errorField = field as Exclude<keyof AddressFormValues, "isDefault">;
      delete nextErrors[errorField];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateAddress(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSubmit({
      ...formValues,
      city: formValues.city.trim(),
      complement: formValues.complement.trim(),
      country: formValues.country.trim() || "Brasil",
      label: formValues.label.trim(),
      neighborhood: formValues.neighborhood.trim(),
      number: formValues.number.trim(),
      state: formValues.state.trim().toUpperCase(),
      street: formValues.street.trim(),
      zipCode: formValues.zipCode.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Fechar modal"
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#dbe4ff] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#171A21]">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
            {mode === "create" ? "Adicionar endereço" : "Editar endereço"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-2 text-[#64748b] transition-colors hover:bg-[#edf2ff] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60 dark:text-[#99A1AF] dark:hover:bg-white/10 dark:hover:text-[#F1F3F5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              Rótulo
              <input
                type="text"
                value={formValues.label}
                onChange={(event) => updateField("label", event.target.value)}
                className={inputClassName}
                placeholder="Casa, Trabalho..."
                disabled={isSubmitting}
              />
              {errors.label ? (
                <span className="text-xs text-[#FB2C36]">{errors.label}</span>
              ) : null}
            </label>

            <label className="mt-1 flex items-center gap-2 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              <input
                type="checkbox"
                checked={formValues.isDefault}
                onChange={(event) =>
                  updateField("isDefault", event.target.checked)
                }
                className="h-4 w-4 rounded border border-[#cbd5e1]"
                disabled={isSubmitting}
              />
              Definir como endereço padrão
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              Rua
              <input
                type="text"
                value={formValues.street}
                onChange={(event) => updateField("street", event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              />
              {errors.street ? (
                <span className="text-xs text-[#FB2C36]">{errors.street}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              Número
              <input
                type="text"
                value={formValues.number}
                onChange={(event) => updateField("number", event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              />
              {errors.number ? (
                <span className="text-xs text-[#FB2C36]">{errors.number}</span>
              ) : null}
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
            Complemento (opcional)
            <input
              type="text"
              value={formValues.complement}
              onChange={(event) =>
                updateField("complement", event.target.value)
              }
              className={inputClassName}
              disabled={isSubmitting}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
            Bairro
            <input
              type="text"
              value={formValues.neighborhood}
              onChange={(event) =>
                updateField("neighborhood", event.target.value)
              }
              className={inputClassName}
              disabled={isSubmitting}
            />
            {errors.neighborhood ? (
              <span className="text-xs text-[#FB2C36]">
                {errors.neighborhood}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              Cidade
              <input
                type="text"
                value={formValues.city}
                onChange={(event) => updateField("city", event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              />
              {errors.city ? (
                <span className="text-xs text-[#FB2C36]">{errors.city}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              Estado
              <input
                type="text"
                value={formValues.state}
                onChange={(event) =>
                  updateField("state", event.target.value.toUpperCase())
                }
                className={inputClassName}
                maxLength={3}
                disabled={isSubmitting}
              />
              {errors.state ? (
                <span className="text-xs text-[#FB2C36]">{errors.state}</span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              CEP
              <input
                type="text"
                value={formValues.zipCode}
                onChange={(event) =>
                  updateField("zipCode", formatZipCodeInput(event.target.value))
                }
                className={inputClassName}
                placeholder="00000-000"
                disabled={isSubmitting}
              />
              {errors.zipCode ? (
                <span className="text-xs text-[#FB2C36]">{errors.zipCode}</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-[var(--font-arimo)] text-[#334155] dark:text-[#CBD5E1]">
              País
              <input
                type="text"
                value={formValues.country}
                onChange={(event) => updateField("country", event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              />
              {errors.country ? (
                <span className="text-xs text-[#FB2C36]">{errors.country}</span>
              ) : null}
            </label>
          </div>

          {submitError ? (
            <div className="rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#2a1117] dark:text-[#fca5a5]">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-xl border border-[#dbe4ff] px-4 text-sm font-[var(--font-arimo)] text-[#334155] transition-colors hover:bg-[#f3f7ff] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.1] dark:text-[#CBD5E1] dark:hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-xl bg-[#5C7CFA] px-4 text-sm font-[var(--font-arimo)] font-medium text-white transition-colors hover:bg-[#4b6cf7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : mode === "create" ? (
                "Criar endereço"
              ) : (
                "Salvar alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
