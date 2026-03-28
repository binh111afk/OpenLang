import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const clientCandidates = [
  resolve(cwd, "client"),
  resolve(cwd, "..", "client"),
];

const clientDir = clientCandidates.find((dir) =>
  existsSync(resolve(dir, "package.json"))
);

if (!clientDir) {
  console.error("Cannot find client/package.json from current working directory:", cwd);
  process.exit(1);
}

function runNpm(args) {
  const result = spawnSync("npm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error("Failed to execute npm", args.join(" "), result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// Ensure client devDependencies (vite, plugins) are available on Vercel.
runNpm(["--prefix", clientDir, "install", "--include=dev"]);
runNpm(["--prefix", clientDir, "run", "build"]);

const sourceDist = resolve(clientDir, "dist");
const targetDist = resolve(cwd, "dist");

rmSync(targetDist, { recursive: true, force: true });
cpSync(sourceDist, targetDist, { recursive: true });

console.log("Prepared dist at:", targetDist);
