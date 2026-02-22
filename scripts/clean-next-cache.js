const fs = require("node:fs");
const path = require("node:path");

const cacheDirs = [".next", ".next-dev"];

for (const dir of cacheDirs) {
  const absolutePath = path.join(process.cwd(), dir);

  if (!fs.existsSync(absolutePath)) {
    console.log(`missing: ${dir}`);
    continue;
  }

  fs.rmSync(absolutePath, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 100,
  });
  console.log(`removed: ${dir}`);
}
