"use client";

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  LoaderCircle,
  LogOut,
  MapPin,
  Package,
  Plus,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AddressFormModal,
  type AddressFormValues,
  EMPTY_ADDRESS_FORM_VALUES,
} from "@/components/profile/address-form-modal";
import { useAuth } from "@/hooks/useAuth";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";

type ProfilePageContentProps = {
  signOutCallbackUrl: string;
};

type ProfileSection = "personal" | "addresses" | "payment" | "security";

type UserAddress = {
  city: string;
  complement?: string | null;
  country: string;
  id: string;
  isDefault: boolean;
  label: string;
  neighborhood: string;
  number: string;
  state: string;
  street: string;
  zipCode: string;
};

type AddressFormMode = "create" | "edit";

type AddressResponsePayload = {
  addresses?: UserAddress[];
};

type AddressApiIssue = {
  field?: string;
  message?: string;
};

type AddressApiErrorPayload = {
  issues?: AddressApiIssue[];
  message?: string;
};

function splitName(fullName?: string | null): [string, string] {
  if (!fullName) {
    return ["Guest", "User"];
  }

  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return [nameParts[0], ""];
  }

  return [nameParts[0], nameParts.slice(1).join(" ")];
}

function formatPhone(phone?: string | number | null): string {
  if (!phone) {
    return "Not provided";
  }

  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11) {
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return String(phone);
}

function mapAddressToFormValues(address: UserAddress): AddressFormValues {
  return {
    city: address.city,
    complement: address.complement ?? "",
    country: address.country,
    isDefault: address.isDefault,
    label: address.label,
    neighborhood: address.neighborhood,
    number: address.number,
    state: address.state,
    street: address.street,
    zipCode: address.zipCode,
  };
}

function buildAddressRequestPayload(values: AddressFormValues) {
  const payload: Record<string, string | boolean> = {
    city: values.city,
    isDefault: values.isDefault,
    label: values.label,
    neighborhood: values.neighborhood,
    number: values.number,
    state: values.state,
    street: values.street,
    zipCode: values.zipCode,
  };

  if (values.complement.trim()) {
    payload.complement = values.complement;
  }

  if (values.country.trim()) {
    payload.country = values.country;
  }

  return payload;
}

async function extractAddressErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const payload = (await response.json()) as AddressApiErrorPayload;
    const issueMessage = payload.issues?.find(
      (issue) => issue.message,
    )?.message;
    if (issueMessage?.trim()) {
      return issueMessage;
    }

    if (payload.message?.trim()) {
      return payload.message;
    }
  } catch {
    // noop
  }

  return fallbackMessage;
}

function SidebarItem({
  icon: Icon,
  isActive,
  label,
  onClick,
}: {
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors ${
        isActive
          ? "bg-[#5C7CFA] text-white shadow-[0_8px_20px_-10px_rgba(92,124,250,0.9)] dark:shadow-[0_10px_15px_-3px_rgba(92,124,250,0.2),0_4px_6px_-4px_rgba(92,124,250,0.2)]"
          : "text-[#64748b] hover:bg-[#edf2ff] hover:text-[#0f172a] dark:text-[#99A1AF] dark:hover:bg-white/5 dark:hover:text-[#F1F3F5]"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-[var(--font-arimo)]">{label}</span>
    </button>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-[var(--font-arimo)] text-[#64748b] dark:text-[#99A1AF]">
        {label}
      </label>
      <div className="flex h-[50px] items-center rounded-2xl border border-[#dbe4ff] bg-[#f8faff] px-4 dark:border-white/[0.06] dark:bg-[#12151A]">
        <p className="text-base font-[var(--font-arimo)] text-[#0f172a] dark:text-[#F1F3F5]">
          {value}
        </p>
      </div>
    </div>
  );
}

function AddressCard({
  address,
  isRemoving,
  onEdit,
  onRemove,
}: {
  address: UserAddress;
  isRemoving: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const lineOne = `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""}`;
  const lineTwo = `${address.city}, ${address.state} ${address.zipCode}`;
  const lineThree = address.country || "Brasil";

  return (
    <div className="relative min-h-[186px] rounded-2xl border border-[#5C7CFA] bg-[rgba(92,124,250,0.05)] p-6">
      <h3 className="text-base font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
        {address.label}
      </h3>

      <div className="mt-2 space-y-0.5 text-sm leading-[1.625] font-[var(--font-arimo)] text-[#64748b] dark:text-[#99A1AF]">
        <p>{lineOne}</p>
        <p>{lineTwo}</p>
        <p>{lineThree}</p>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm font-[var(--font-arimo)] font-medium">
        <button
          type="button"
          onClick={onEdit}
          disabled={isRemoving}
          className="text-[#5C7CFA] transition-colors hover:text-[#7991ff] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="text-[#FB2C36] transition-colors hover:text-[#ff5a61] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRemoving ? "Removing..." : "Remove"}
        </button>
      </div>

      {address.isDefault && (
        <span className="absolute top-4 right-4 rounded bg-[rgba(92,124,250,0.1)] px-2 py-1 text-xs font-[var(--font-arimo)] font-bold tracking-[0.04em] text-[#5C7CFA]">
          DEFAULT
        </span>
      )}
    </div>
  );
}

function AddAddressCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[186px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-[#dbe4ff] bg-[#f8faff] transition-colors hover:bg-[#eef4ff] dark:border-white/[0.1] dark:bg-[#12151A] dark:hover:bg-[#181d24]"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8efff] text-[#5C7CFA] dark:bg-white/[0.05] dark:text-[#99A1AF]">
        <Plus className="h-5 w-5" />
      </span>
      <span className="text-sm font-[var(--font-arimo)] font-medium text-[#475569] dark:text-[#99A1AF]">
        Add New Address
      </span>
    </button>
  );
}

export function ProfilePageContent({
  signOutCallbackUrl,
}: ProfilePageContentProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("personal");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [hasLoadedAddresses, setHasLoadedAddresses] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressFormMode, setAddressFormMode] =
    useState<AddressFormMode>("create");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressFormInitialValues, setAddressFormInitialValues] =
    useState<AddressFormValues>(EMPTY_ADDRESS_FORM_VALUES);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressFormServerError, setAddressFormServerError] = useState<
    string | null
  >(null);
  const [removingAddressId, setRemovingAddressId] = useState<string | null>(
    null,
  );
  const headingBySection: Record<ProfileSection, string> = {
    personal: "Personal Information",
    addresses: "Saved Addresses",
    payment: "Payment Methods",
    security: "Security",
  };

  const loadAddresses = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!isAuthenticated) {
        return false;
      }

      if (showLoader) {
        setIsLoadingAddresses(true);
      }

      try {
        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        if (!response.ok) {
          const message = await extractAddressErrorMessage(
            response,
            "Não foi possível carregar os endereços.",
          );
          throw new Error(message);
        }

        const data = (await response.json()) as AddressResponsePayload;
        setAddresses(data.addresses ?? []);
        setHasLoadedAddresses(true);
        return true;
      } catch (error) {
        console.error("Error loading addresses:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os endereços.",
        );
        return false;
      } finally {
        if (showLoader) {
          setIsLoadingAddresses(false);
        }
      }
    },
    [isAuthenticated],
  );

  function openCreateAddressModal() {
    setAddressFormMode("create");
    setEditingAddressId(null);
    setAddressFormInitialValues(EMPTY_ADDRESS_FORM_VALUES);
    setAddressFormServerError(null);
    setIsAddressModalOpen(true);
  }

  function openEditAddressModal(address: UserAddress) {
    setAddressFormMode("edit");
    setEditingAddressId(address.id);
    setAddressFormInitialValues(mapAddressToFormValues(address));
    setAddressFormServerError(null);
    setIsAddressModalOpen(true);
  }

  function closeAddressModal() {
    if (isSavingAddress) {
      return;
    }

    setIsAddressModalOpen(false);
    setAddressFormServerError(null);
  }

  async function handleAddressSubmit(values: AddressFormValues) {
    const method = addressFormMode === "create" ? "POST" : "PUT";
    const endpoint = "/api/addresses";
    const payload = buildAddressRequestPayload(values);

    if (addressFormMode === "edit") {
      if (!editingAddressId) {
        setAddressFormServerError(
          "Não foi possível identificar o endereço para edição.",
        );
        return;
      }

      payload.id = editingAddressId;
    }

    setIsSavingAddress(true);
    setAddressFormServerError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await extractAddressErrorMessage(
          response,
          "Não foi possível salvar o endereço.",
        );
        setAddressFormServerError(message);
        return;
      }

      const didRefreshAddresses = await loadAddresses({ showLoader: false });
      if (!didRefreshAddresses) {
        setAddressFormServerError(
          "Endereço salvo, mas não foi possível atualizar a lista. Recarregue a página.",
        );
        return;
      }

      setIsAddressModalOpen(false);
      setAddressFormServerError(null);
      toast.success(
        addressFormMode === "create"
          ? "Endereço criado com sucesso."
          : "Endereço atualizado com sucesso.",
      );
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressFormServerError(
        "Não foi possível salvar o endereço. Tente novamente.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleRemoveAddress(address: UserAddress) {
    const confirmRemoval = window.confirm(
      `Deseja remover o endereço "${address.label}"?`,
    );

    if (!confirmRemoval) {
      return;
    }

    setRemovingAddressId(address.id);

    try {
      const response = await fetch(`/api/addresses?id=${address.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await extractAddressErrorMessage(
          response,
          "Não foi possível remover o endereço.",
        );
        toast.error(message);
        return;
      }

      const didRefreshAddresses = await loadAddresses({ showLoader: false });
      if (!didRefreshAddresses) {
        toast.error(
          "Endereço removido, mas não foi possível atualizar a lista automaticamente.",
        );
        return;
      }

      toast.success("Endereço removido com sucesso.");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Não foi possível remover o endereço.");
    } finally {
      setRemovingAddressId(null);
    }
  }

  useEffect(() => {
    if (
      activeSection !== "addresses" ||
      hasLoadedAddresses ||
      !isAuthenticated
    ) {
      return;
    }

    void loadAddresses();
  }, [activeSection, hasLoadedAddresses, isAuthenticated, loadAddresses]);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    const callbackPath = "/perfil";

    router.replace(
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl: callbackPath,
        fromPath: callbackPath,
      }),
    );
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f4f8ff] dark:bg-[#0B0D10]">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#5C7CFA]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const [firstName, lastName] = splitName(user.name);
  return (
    <div className="w-full bg-[#f8faff] text-[#0f172a] dark:bg-[#0B0D10] dark:text-[#F1F3F5]">
      <div className="mx-auto w-full max-w-[1536px] px-4 pt-12 pb-16 sm:px-6 lg:px-8">
        <h1 className="text-[36px] leading-[40px] font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
          My Profile
        </h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="w-full lg:w-64 lg:shrink-0">
            <div className="space-y-8">
              <nav className="space-y-1">
                <SidebarItem
                  icon={User}
                  isActive={activeSection === "personal"}
                  label="Personal Info"
                  onClick={() => setActiveSection("personal")}
                />
                <SidebarItem
                  icon={MapPin}
                  isActive={activeSection === "addresses"}
                  label="Addresses"
                  onClick={() => setActiveSection("addresses")}
                />
                <SidebarItem
                  icon={CreditCard}
                  isActive={activeSection === "payment"}
                  label="Payment Methods"
                  onClick={() => setActiveSection("payment")}
                />
                <SidebarItem
                  icon={Shield}
                  isActive={activeSection === "security"}
                  label="Security"
                  onClick={() => setActiveSection("security")}
                />

                <Link
                  href="/orders"
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-[#64748b] transition-colors hover:bg-[#edf2ff] hover:text-[#0f172a] dark:text-[#99A1AF] dark:hover:bg-white/5 dark:hover:text-[#F1F3F5]"
                >
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-[var(--font-arimo)]">
                    My Orders
                  </span>
                </Link>
              </nav>

              <div className="border-t border-[#dbe4ff] pt-8 dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => {
                    signOut({
                      callbackUrl: signOutCallbackUrl,
                      redirect: true,
                    });
                  }}
                  className="flex h-11 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm text-[#FB2C36] transition-colors hover:bg-[#FB2C36]/10"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-[var(--font-arimo)]">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </aside>

          <section className="min-h-[500px] flex-1 rounded-2xl border border-[#dbe4ff] bg-white px-6 py-8 sm:px-8 dark:border-white/[0.06] dark:bg-[#171A21]">
            {activeSection === "addresses" ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl leading-8 font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
                  {headingBySection[activeSection]}
                </h2>
                <button
                  type="button"
                  onClick={openCreateAddressModal}
                  className="inline-flex h-9 items-center rounded-2xl border border-[#dbe4ff] bg-white px-3.5 text-sm font-[var(--font-arimo)] font-medium text-[#0f172a] transition-colors hover:bg-[#f3f7ff] dark:border-white/[0.1] dark:bg-[#171A21] dark:text-[#F1F3F5] dark:hover:bg-[#1f2430]"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add New
                </button>
              </div>
            ) : (
              <h2 className="text-2xl leading-8 font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
                {headingBySection[activeSection]}
              </h2>
            )}

            {activeSection === "personal" && (
              <form
                className="mt-8 max-w-[576px] space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  toast("Profile update will be available soon.");
                }}
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <InfoField
                    label="First Name"
                    value={firstName || "Not provided"}
                  />
                  <InfoField
                    label="Last Name"
                    value={lastName || "Not provided"}
                  />
                </div>

                <InfoField
                  label="Email Address"
                  value={user.email || "Not provided"}
                />
                <InfoField
                  label="Phone Number"
                  value={formatPhone(user.phone)}
                />

                <button
                  type="submit"
                  className="h-11 rounded-2xl bg-[#FF2E63] px-6 text-base font-[var(--font-arimo)] text-white transition-colors hover:bg-[#ff4a78]"
                >
                  Save Changes
                </button>
              </form>
            )}

            {activeSection === "addresses" && (
              <>
                {isLoadingAddresses ? (
                  <div className="mt-8 flex h-[200px] items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-[#5C7CFA]" />
                  </div>
                ) : (
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {addresses.length > 0 ? (
                      addresses.map((address) => (
                        <AddressCard
                          key={address.id}
                          address={address}
                          isRemoving={removingAddressId === address.id}
                          onEdit={() => openEditAddressModal(address)}
                          onRemove={() => void handleRemoveAddress(address)}
                        />
                      ))
                    ) : (
                      <div className="flex min-h-[186px] flex-col justify-center rounded-2xl border border-[#dbe4ff] bg-[#f8faff] p-6 dark:border-white/[0.1] dark:bg-[#12151A]">
                        <h3 className="text-base font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
                          No saved addresses yet
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed font-[var(--font-arimo)] text-[#64748b] dark:text-[#99A1AF]">
                          Add your first address to speed up checkout.
                        </p>
                      </div>
                    )}

                    <AddAddressCard onClick={openCreateAddressModal} />
                  </div>
                )}
              </>
            )}

            {(activeSection === "payment" || activeSection === "security") && (
              <div className="mt-8 max-w-[576px] rounded-2xl border border-[#dbe4ff] bg-[#f8faff] p-6 dark:border-white/[0.06] dark:bg-[#12151A]">
                <p className="text-sm leading-relaxed font-[var(--font-arimo)] text-[#64748b] dark:text-[#99A1AF]">
                  This section is under construction and will follow the same
                  style as the approved profile design.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <AddressFormModal
        initialValues={addressFormInitialValues}
        isOpen={isAddressModalOpen}
        isSubmitting={isSavingAddress}
        mode={addressFormMode}
        onClose={closeAddressModal}
        onSubmit={handleAddressSubmit}
        submitError={addressFormServerError}
      />
    </div>
  );
}
