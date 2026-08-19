const fs = require("fs");
const path = require("path");

const srcDir = path.join(process.cwd(), "src");

function processDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".ts")) continue;

    let content = fs.readFileSync(fullPath, "utf8");

    // import ... from "./file"
    // import ... from "../file"
    // export ... from "./file"
    // export ... from "../file"
    content = content.replace(
      /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
      (match, prefix, importPath, suffix) => {
        if (
          importPath.endsWith(".js") ||
          importPath.endsWith(".json") ||
          importPath.endsWith(".ts")
        ) {
          return match;
        }

        return `${prefix}${importPath}.js${suffix}`;
      }
    );

    // import("./file")
    content = content.replace(
      /(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g,
      (match, prefix, importPath, suffix) => {
        if (
          importPath.endsWith(".js") ||
          importPath.endsWith(".json") ||
          importPath.endsWith(".ts")
        ) {
          return match;
        }

        return `${prefix}${importPath}.js${suffix}`;
      }
    );

    fs.writeFileSync(fullPath, content);
  }
}

processDirectory(srcDir);

console.log("Finished adding .js extensions to local imports.");