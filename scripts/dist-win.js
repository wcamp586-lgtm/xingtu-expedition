const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const electronBuilderCli = path.join(root, "node_modules", "electron-builder", "cli.js");

const result = spawnSync(process.execPath, [electronBuilderCli, "--win", "nsis", "--x64"], {
  cwd: root,
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: "false"
  },
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
