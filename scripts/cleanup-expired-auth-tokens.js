const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseArgs(argv) {
  const options = {
    apply: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    throw new Error(`Argumento nao suportado: ${arg}`);
  }

  return options;
}

function printUsage() {
  console.log(`Limpeza de tokens expirados de autenticacao

Uso:
  node scripts/cleanup-expired-auth-tokens.js [--apply]

Opcoes:
  --apply    Executa a limpeza no banco. Sem essa flag roda em dry-run.
  --help,-h  Exibe esta ajuda.
`);
}

async function countExpiredAuthTokens(referenceDate) {
  const [expiredEmailVerificationTokens, expiredResetPasswordTokens] =
    await Promise.all([
      prisma.user.count({
        where: {
          emailVerificationTokenHash: {
            not: null,
          },
          emailVerificationExpires: {
            lte: referenceDate,
          },
        },
      }),
      prisma.user.count({
        where: {
          resetPasswordTokenHash: {
            not: null,
          },
          resetPasswordExpires: {
            lte: referenceDate,
          },
        },
      }),
    ]);

  return {
    expiredEmailVerificationTokens,
    expiredResetPasswordTokens,
  };
}

async function cleanupExpiredAuthTokens(referenceDate) {
  const [emailVerificationCleanupResult, resetPasswordCleanupResult] =
    await prisma.$transaction([
      prisma.user.updateMany({
        where: {
          emailVerificationTokenHash: {
            not: null,
          },
          emailVerificationExpires: {
            lte: referenceDate,
          },
        },
        data: {
          emailVerificationTokenHash: null,
          emailVerificationExpires: null,
        },
      }),
      prisma.user.updateMany({
        where: {
          resetPasswordTokenHash: {
            not: null,
          },
          resetPasswordExpires: {
            lte: referenceDate,
          },
        },
        data: {
          resetPasswordTokenHash: null,
          resetPasswordExpires: null,
        },
      }),
    ]);

  return {
    cleanedEmailVerificationTokens: emailVerificationCleanupResult.count,
    cleanedResetPasswordTokens: resetPasswordCleanupResult.count,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const referenceDate = new Date();
  const expiredTokensSnapshot = await countExpiredAuthTokens(referenceDate);

  if (!options.apply) {
    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          referenceDate: referenceDate.toISOString(),
          ...expiredTokensSnapshot,
        },
        null,
        2,
      ),
    );
    return;
  }

  const cleanupResult = await cleanupExpiredAuthTokens(referenceDate);
  const remainingExpiredTokens = await countExpiredAuthTokens(referenceDate);

  console.log(
    JSON.stringify(
      {
        mode: "apply",
        referenceDate: referenceDate.toISOString(),
        ...expiredTokensSnapshot,
        ...cleanupResult,
        remainingExpiredTokens,
      },
      null,
      2,
    ),
  );
}

run()
  .catch((error) => {
    console.error("Falha ao executar limpeza de tokens expirados", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
