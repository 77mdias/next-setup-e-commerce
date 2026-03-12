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

const IGNORED_PREFIXES = [".next/", ".next-dev/", "node_modules/"];

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

function isSupportedFile(filePath) {
  if (IGNORED_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return false;
  }

  if (!fs.existsSync(path.join(process.cwd(), filePath))) {
    return false;
  }

  return SUPPORTED_EXTENSIONS.has(path.extname(filePath));
}

function getChangedFiles() {
  const files = new Set([
    ...runGitCommand(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...runGitCommand(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    ...runGitCommand(["ls-files", "--others", "--exclude-standard"]),
  ]);

  return [...files].filter(isSupportedFile).sort();
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
  const mode = process.argv.includes("--write") ? "--write" : "--check";
  const files = getChangedFiles();

  if (files.length === 0) {
    console.log("No supported changed files to check.");
    return;
  }

  runPrettier(mode, files);
}

main();
