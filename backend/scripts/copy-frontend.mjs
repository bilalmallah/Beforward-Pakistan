import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.resolve(__dirname, "..");
const frontendDist = path.resolve(backendDir, "../frontend/dist");
const backendDist = path.resolve(backendDir, "dist");

if (!fs.existsSync(frontendDist)) {
  console.error("❌ Frontend dist not found:", frontendDist);
  process.exit(1);
}

fs.mkdirSync(backendDist, { recursive: true });

function copyRecursive(source, destination) {
  fs.cpSync(source, destination, {
    recursive: true,
    force: true,
  });
}

copyRecursive(frontendDist, backendDist);

console.log("✅ Frontend copied to:", backendDist);