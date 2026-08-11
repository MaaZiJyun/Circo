import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs"]);
const ignored = new Set(["node_modules", ".next", ".git"]);
const failures = [];

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(filePath);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).length;
    if (lines > 300)
      failures.push(`${path.relative(root, filePath)}: ${lines}`);
  }
}

visit(root);
if (failures.length) {
  console.error(`Files over 300 lines:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("Line limit passed.");
