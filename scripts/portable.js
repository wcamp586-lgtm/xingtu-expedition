const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const packageJson = require("../package.json");
const electronBuilderCli = path.join(root, "node_modules", "electron-builder", "cli.js");
const desktop = path.join(process.env.USERPROFILE || process.env.HOME || root, "Desktop");
const portableName = `${packageJson.build.productName} ${packageJson.version} 免安装版`;
const sourceDir = path.join(root, "dist", "win-unpacked");
const targetDir = path.join(desktop, portableName);
const zipPath = path.join(desktop, `${portableName}.zip`);

function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

const result = spawnSync(process.execPath, [electronBuilderCli, "--win", "dir", "--x64"], {
  cwd: root,
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: "false"
  },
  stdio: "inherit",
  shell: false
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}

removeIfExists(targetDir);
fs.cpSync(sourceDir, targetDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });

const zipResult = spawnSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -LiteralPath ${JSON.stringify(targetDir)} -DestinationPath ${JSON.stringify(zipPath)} -Force`
  ],
  {
    cwd: root,
    stdio: "inherit",
    shell: false
  }
);

if ((zipResult.status ?? 1) !== 0) {
  process.exit(zipResult.status ?? 1);
}

console.log(`Portable folder: ${targetDir}`);
console.log(`Portable archive: ${zipPath}`);
