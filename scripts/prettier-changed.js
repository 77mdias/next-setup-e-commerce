#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".scss",
  ".css",
  ".prisma",
]);

const IGNORED_PREFIXES = [
  ".next/",
  ".next-dev/",
  "node_modules/",
  "playwright-report/",
  "test-results/",
];

function runGitCommand(args) {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function tryRunGitCommand(args) {
  try {
    return runGitCommand(args);
  } catch {
    return [];
  }
}

function isSupportedFile(filePath) {
  if (IGNORED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }

  if (!fs.existsSync(path.join(process.cwd(), filePath))) {
    return false;
  }

  return SUPPORTED_EXTENSIONS.has(path.extname(filePath));
}

function normalizeBaseRef(baseRef) {
  if (!baseRef) {
    return null;
  }

  return baseRef.replace(/^refs\/remotes\//, "");
}

function resolveBaseRef(cliBaseRef) {
  const candidates = [
    cliBaseRef,
    process.env.PRETTIER_BASE_REF,
    ...tryRunGitCommand(["symbolic-ref", "refs/remotes/origin/HEAD"]),
    "origin/main",
    "main",
    "origin/master",
    "master",
  ]
    .map((candidate) => normalizeBaseRef(candidate?.trim()))
    .filter(Boolean);

  for (const candidate of candidates) {
    const refExists = spawnSync("git", ["rev-parse", "--verify", candidate], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    if (refExists.status === 0) {
      return candidate;
    }
  }

  return null;
}

function getChangedFiles(baseRef) {
  const files = new Set([
    ...(baseRef
      ? (() => {
          const mergeBase = tryRunGitCommand([
            "merge-base",
            baseRef,
            "HEAD",
          ])[0];
          if (!mergeBase) {
            return [];
          }

          return tryRunGitCommand([
            "diff",
            "--name-only",
            "--diff-filter=ACMR",
            `${mergeBase}...HEAD`,
          ]);
        })()
      : []),
    ...runGitCommand(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...runGitCommand(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    ...runGitCommand(["ls-files", "--others", "--exclude-standard"]),
  ]);

  return [...files].filter(isSupportedFile).sort();
}

function getExplicitFiles(files) {
  return [...new Set(files)].filter(isSupportedFile).sort();
}

function runPrettier(mode, files) {
  const prettierCli = require.resolve("prettier/bin/prettier.cjs");
  const args = [prettierCli, mode, ...files];
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}

function main() {
  let mode = "--check";
  let cliBaseRef = null;
  const explicitFiles = [];

  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];

    if (arg === "--check" || arg === "--write") {
      mode = arg;
      continue;
    }

    if (arg === "--base-ref") {
      cliBaseRef = process.argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith("--base-ref=")) {
      cliBaseRef = arg.slice("--base-ref=".length);
      continue;
    }

    explicitFiles.push(arg);
  }

  const baseRef = resolveBaseRef(cliBaseRef);
  const files =
    explicitFiles.length > 0
      ? getExplicitFiles(explicitFiles)
      : getChangedFiles(baseRef);

  if (files.length === 0) {
    console.log("No supported changed files to check.");
    return;
  }

  runPrettier(mode, files);
}

main();
