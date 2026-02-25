import { normalizeCallbackPath } from "@/lib/callback-url";

export const ACCESS_FEEDBACK_PATH = "/status";

export type AccessFeedbackReason =
  | "auth-required"
  | "forbidden"
  | "maintenance"
  | "outage"
  | "development"
  | "unavailable";

type BuildAccessFeedbackPathOptions = {
  reason: AccessFeedbackReason;
  callbackUrl?: string | null;
  fromPath?: string | null;
};

const validReasons = new Set<AccessFeedbackReason>([
  "auth-required",
  "forbidden",
  "maintenance",
  "outage",
  "development",
  "unavailable",
]);

export function normalizeAccessFeedbackReason(
  value?: string | null,
): AccessFeedbackReason {
  if (!value) {
    return "unavailable";
  }

  const normalized = value.trim().toLowerCase() as AccessFeedbackReason;
  return validReasons.has(normalized) ? normalized : "unavailable";
}

export function buildAccessFeedbackPath({
  reason,
  callbackUrl,
  fromPath,
}: BuildAccessFeedbackPathOptions): string {
  const params = new URLSearchParams();
  params.set("reason", reason);

  if (callbackUrl) {
    params.set("callbackUrl", normalizeCallbackPath(callbackUrl, "/"));
  }

  if (fromPath?.startsWith("/")) {
    params.set("from", fromPath);
  }

  return `${ACCESS_FEEDBACK_PATH}?${params.toString()}`;
}

export function resolveRuntimeAccessReason(
  mode?: string | null,
): AccessFeedbackReason | null {
  if (!mode) {
    return null;
  }

  switch (mode.trim().toLowerCase()) {
    case "maintenance":
      return "maintenance";
    case "outage":
    case "offline":
      return "outage";
    case "development":
      return "development";
    case "unavailable":
      return "unavailable";
    default:
      return null;
  }
}
