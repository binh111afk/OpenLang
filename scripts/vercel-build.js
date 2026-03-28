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

const buildResult = spawnSync("npm", ["--prefix", clientDir, "run", "build"], {
  stdio: "inherit",
  shell: true,
});

if (buildResult.error) {
  console.error("Failed to execute npm build:", buildResult.error.message);
  process.exit(1);
}

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const sourceDist = resolve(clientDir, "dist");
const targetDist = resolve(cwd, "dist");

rmSync(targetDist, { recursive: true, force: true });
cpSync(sourceDist, targetDist, { recursive: true });

console.log("Prepared dist at:", targetDist);
