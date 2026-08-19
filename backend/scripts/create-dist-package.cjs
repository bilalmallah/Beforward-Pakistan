const fs = require("fs");
const path = require("path");

const distPath = path.join(process.cwd(), "dist");

fs.writeFileSync(
  path.join(distPath, "package.json"),
  JSON.stringify({ type: "commonjs" }, null, 2)
);

console.log("Created dist/package.json");