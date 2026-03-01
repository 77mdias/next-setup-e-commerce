const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseArgs(argv) {
  const options = {
    apply: false,
    limit: null,
    report: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--limit") {
      const nextValue = argv[index + 1];
      const parsedLimit = Number.parseInt(nextValue || "", 10);

      if (!Number.isSafeInteger(parsedLimit) || parsedLimit <= 0) {
        throw new Error("--limit precisa ser um inteiro positivo");
      }

      options.limit = parsedLimit;
      index += 1;
      continue;
    }

    if (arg === "--report") {
      const reportPath = argv[index + 1];

      if (!reportPath) {
        throw new Error("--report precisa receber um caminho de arquivo");
      }

      options.report = reportPath;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      return options;
    }

    throw new Error(`Argumento nao suportado: ${arg}`);
  }

  return options;
}

function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function printUsage() {
  console.log(`Backfill de Order.userId usando customerEmail

Uso:
  node scripts/backfill-order-user-id.js [--apply] [--limit <n>] [--report <arquivo.md>]

Opcoes:
  --apply          Persiste alteracoes. Sem essa flag, roda apenas em dry-run.
  --limit <n>      Limita quantidade de pedidos legados processados.
  --report <path>  Salva relatorio em markdown para auditoria manual.
  --help, -h       Exibe esta ajuda.
`);
}

function buildReportMarkdown({
  mode,
  summary,
  eligiblePreview,
  unresolvedPreview,
}) {
  const lines = [
    "# S02-ORD-002 Backfill Report",
    "",
    `- Generated at: ${summary.generatedAt}`,
    `- Mode: ${mode}`,
    `- Scanned legacy orders: ${summary.scannedLegacyOrders}`,
    `- Eligible to link: ${summary.eligibleToLink}`,
    `- Manual review required: ${summary.manualReviewRequired}`,
    `- Updated rows: ${summary.updatedRows}`,
    `- Skipped by race condition: ${summary.skippedByRaceCondition}`,
    "",
    "## Eligible preview",
    "",
  ];

  if (eligiblePreview.length === 0) {
    lines.push("Nenhum pedido elegivel encontrado.");
  } else {
    lines.push("| orderId | userId | normalizedEmail |", "| --- | --- | --- |");
    eligiblePreview.forEach((item) => {
      lines.push(`| ${item.orderId} | ${item.userId} | ${item.normalizedEmail} |`);
    });
  }

  lines.push("", "## Manual review preview", "");

  if (unresolvedPreview.length === 0) {
    lines.push("Nenhum caso pendente de revisao manual.");
  } else {
    lines.push("| orderId | reason | normalizedEmail | matchedUserIds |", "| --- | --- | --- | --- |");
    unresolvedPreview.forEach((item) => {
      lines.push(
        `| ${item.orderId} | ${item.reason} | ${item.normalizedEmail || "-"} | ${
          item.matchedUserIds.length > 0 ? item.matchedUserIds.join(",") : "-"
        } |`,
      );
    });
  }

  lines.push("", "## Manual review reasons", "");
  lines.push("- missing_order_email: pedido sem customerEmail.");
  lines.push("- user_not_found: nenhum usuario encontrado por customerEmail.");
  lines.push("- ambiguous_user_email: mais de um usuario encontrado (case-insensitive). ");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const mode = options.apply ? "apply" : "dry-run";

  const legacyOrders = await prisma.order.findMany({
    where: {
      userId: null,
    },
    select: {
      id: true,
      customerEmail: true,
    },
    orderBy: {
      id: "asc",
    },
    ...(options.limit ? { take: options.limit } : {}),
  });

  const usersByEmailCache = new Map();
  const eligible = [];
  const unresolved = [];

  for (const order of legacyOrders) {
    const normalizedEmail = normalizeEmail(order.customerEmail);

    if (!normalizedEmail) {
      unresolved.push({
        orderId: order.id,
        reason: "missing_order_email",
        normalizedEmail: null,
        matchedUserIds: [],
      });
      continue;
    }

    if (!usersByEmailCache.has(normalizedEmail)) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
        take: 2,
      });

      usersByEmailCache.set(normalizedEmail, users);
    }

    const users = usersByEmailCache.get(normalizedEmail);

    if (!users || users.length === 0) {
      unresolved.push({
        orderId: order.id,
        reason: "user_not_found",
        normalizedEmail,
        matchedUserIds: [],
      });
      continue;
    }

    if (users.length > 1) {
      unresolved.push({
        orderId: order.id,
        reason: "ambiguous_user_email",
        normalizedEmail,
        matchedUserIds: users.map((user) => user.id),
      });
      continue;
    }

    eligible.push({
      orderId: order.id,
      userId: users[0].id,
      normalizedEmail,
    });
  }

  let updatedRows = 0;
  let skippedByRaceCondition = 0;

  if (options.apply) {
    for (const item of eligible) {
      const result = await prisma.order.updateMany({
        where: {
          id: item.orderId,
          userId: null,
          customerEmail: {
            equals: item.normalizedEmail,
            mode: "insensitive",
          },
        },
        data: {
          userId: item.userId,
        },
      });

      if (result.count > 0) {
        updatedRows += result.count;
      } else {
        skippedByRaceCondition += 1;
      }
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    scannedLegacyOrders: legacyOrders.length,
    eligibleToLink: eligible.length,
    manualReviewRequired: unresolved.length,
    updatedRows,
    skippedByRaceCondition,
  };

  console.log("S02-ORD-002 backfill summary");
  console.log(JSON.stringify({ mode, summary }, null, 2));

  if (options.report) {
    const reportPath = path.resolve(process.cwd(), options.report);
    const reportContent = buildReportMarkdown({
      mode,
      summary,
      eligiblePreview: eligible.slice(0, 50),
      unresolvedPreview: unresolved.slice(0, 200),
    });

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, reportContent, "utf8");

    console.log(`Relatorio salvo em: ${reportPath}`);
  }

  if (unresolved.length > 0) {
    const unresolvedPreview = unresolved.slice(0, 25);
    console.log("Manual review preview (max 25):");
    console.log(JSON.stringify(unresolvedPreview, null, 2));
  }
}

run()
  .catch((error) => {
    console.error("Erro no backfill S02-ORD-002:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
