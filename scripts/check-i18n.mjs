import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readKeys(fileName) {
  const content = fs.readFileSync(
    path.join(root, "src", "shared", "i18n", fileName),
    "utf8",
  );
  return new Set(
    [...content.matchAll(/^\s*"([^"]+)":/gm)].map((match) => match[1]),
  );
}

const zh = readKeys("zh.ts");
const en = readKeys("en.ts");
const missingEn = [...zh].filter((key) => !en.has(key));
const missingZh = [...en].filter((key) => !zh.has(key));

if (missingEn.length || missingZh.length) {
  console.error(`Missing English keys: ${missingEn.join(", ") || "none"}`);
  console.error(`Missing Chinese keys: ${missingZh.join(", ") || "none"}`);
  process.exit(1);
}

console.log(`Translation keys passed (${zh.size}).`);
