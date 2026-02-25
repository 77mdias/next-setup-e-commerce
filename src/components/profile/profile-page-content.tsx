"use client";

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  LoaderCircle,
  LogOut,
  MapPin,
  Plus,
  Shield,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

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
  onEdit,
  onRemove,
}: {
  address: UserAddress;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const lineOne = `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""}`;
  const lineTwo = `${address.city}, ${address.state} ${address.zipCode}`;
  const lineThree = address.country || "United States";

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
          className="text-[#5C7CFA] transition-colors hover:text-[#7991ff]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-[#FB2C36] transition-colors hover:text-[#ff5a61]"
        >
          Remove
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
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] =
    useState<ProfileSection>("personal");
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [hasLoadedAddresses, setHasLoadedAddresses] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const primaryAddress = useMemo(
    () =>
      addresses.find((address) => address.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );
  const headingBySection: Record<ProfileSection, string> = {
    personal: "Personal Information",
    addresses: "Saved Addresses",
    payment: "Payment Methods",
    security: "Security",
  };

  useEffect(() => {
    if (
      activeSection !== "addresses" ||
      hasLoadedAddresses ||
      !isAuthenticated
    ) {
      return;
    }

    let isCancelled = false;

    async function loadAddresses() {
      setIsLoadingAddresses(true);

      try {
        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load addresses");
        }

        const data = (await response.json()) as { addresses?: UserAddress[] };

        if (!isCancelled) {
          setAddresses(data.addresses ?? []);
          setHasLoadedAddresses(true);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading addresses:", error);
          toast.error("Could not load addresses.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingAddresses(false);
        }
      }
    }

    loadAddresses();

    return () => {
      isCancelled = true;
    };
  }, [activeSection, hasLoadedAddresses, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f4f8ff] dark:bg-[#0B0D10]">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#5C7CFA]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center bg-[#f4f8ff] px-4 py-12 dark:bg-[#0B0D10]">
        <div className="max-w-md rounded-2xl border border-[#dbe4ff] bg-white p-8 text-center dark:border-white/[0.06] dark:bg-[#171A21]">
          <h1 className="text-2xl font-[var(--font-space-grotesk)] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
            Acesso não autorizado
          </h1>
          <p className="mt-3 text-sm font-[var(--font-arimo)] text-[#64748b] dark:text-[#99A1AF]">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
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
                  onClick={() =>
                    toast("Address creation will be available soon.")
                  }
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
                    {primaryAddress ? (
                      <AddressCard
                        address={primaryAddress}
                        onEdit={() =>
                          toast("Address editing will be available soon.")
                        }
                        onRemove={() =>
                          toast("Address removal will be available soon.")
                        }
                      />
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

                    <AddAddressCard
                      onClick={() =>
                        toast("Address creation will be available soon.")
                      }
                    />
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
    </div>
  );
}
