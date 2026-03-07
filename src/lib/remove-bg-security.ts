const REMOVE_BG_DEFAULT_ALLOWED_HOSTS = [
  "u9a6wmr3as.ufs.sh",
  "cdn.awsli.com.br",
  "cwsmgmt.corsair.com",
  "cdn.pichau.com.br",
  "i.zst.com.br",
  "horizonplay.fbitsstatic.net",
  "logos-world.net",
  "upload.wikimedia.org",
  "1000logos.net",
  "logodownload.org",
  "encrypted-tbn0.gstatic.com",
  "cdn.freebiesupply.com",
  "gazin-images.gazin.com.br",
  "www.mielectro.es",
  "m.media-amazon.com",
  "http2.mlstatic.com",
  "images.kabum.com.br",
  "cdn.dooca.store",
  "media.pichau.com.br",
  "cdn.shopify.com",
  "a-static.mlcdn.com.br",
  "dlcdnwebimgs.asus.com",
  "www.kabum.com.br",
  "samsungbrshop.vtexassets.com",
];

const DEV_ONLY_ALLOWED_HOSTS = ["localhost", "127.0.0.1", "::1"];
const REMOVE_BG_ALLOWED_HOSTS_ENV = "REMOVE_BG_ALLOWED_IMAGE_HOSTS";
const REMOVE_BG_ALLOWED_PROTOCOLS_ENV = "REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS";

type ImageUrlValidationResult =
  | {
      valid: true;
      normalizedUrl: string;
    }
  | {
      valid: false;
      error: string;
    };

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

function normalizeProtocol(protocol: string): string {
  return protocol.endsWith(":") ? protocol : `${protocol}:`;
}

function getAllowedProtocols(): string[] {
  const configured = parseCsvEnv(process.env[REMOVE_BG_ALLOWED_PROTOCOLS_ENV]).map(
    normalizeProtocol,
  );

  if (configured.length > 0) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return ["https:"];
  }

  return ["https:", "http:"];
}

function getAllowedHosts(): string[] {
  const configuredHosts = parseCsvEnv(process.env[REMOVE_BG_ALLOWED_HOSTS_ENV]);

  if (configuredHosts.length > 0) {
    return configuredHosts;
  }

  if (process.env.NODE_ENV === "production") {
    return REMOVE_BG_DEFAULT_ALLOWED_HOSTS;
  }

  return [...REMOVE_BG_DEFAULT_ALLOWED_HOSTS, ...DEV_ONLY_ALLOWED_HOSTS];
}

function isAllowedHost(hostname: string, allowedHosts: string[]): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return allowedHosts.some((entry) => {
    if (entry.startsWith("*.")) {
      const suffix = entry.slice(2);
      return (
        normalizedHostname === suffix ||
        normalizedHostname.endsWith(`.${suffix}`)
      );
    }

    return normalizedHostname === entry;
  });
}

export function getServerRemoveBgApiKey(): string | null {
  const apiKey = process.env.REMOVE_BG_API_KEY?.trim();
  return apiKey && apiKey.length > 0 ? apiKey : null;
}

export function validateRemoveBgImageUrl(rawUrl: string): ImageUrlValidationResult {
  const trimmed = rawUrl.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "URL da imagem é obrigatória",
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: "URL da imagem inválida",
    };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return {
      valid: false,
      error: "URL da imagem inválida",
    };
  }

  const allowedProtocols = getAllowedProtocols();
  if (!allowedProtocols.includes(parsedUrl.protocol.toLowerCase())) {
    return {
      valid: false,
      error: "Protocolo da imagem não permitido",
    };
  }

  if (!isAllowedHost(parsedUrl.hostname, getAllowedHosts())) {
    return {
      valid: false,
      error: "Origem da imagem não permitida",
    };
  }

  return {
    valid: true,
    normalizedUrl: parsedUrl.toString(),
  };
}
