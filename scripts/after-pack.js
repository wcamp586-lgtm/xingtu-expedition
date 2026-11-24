const fs = require("fs");
const path = require("path");
const { rcedit } = require("rcedit");

function findExecutable(appOutDir) {
  return fs
    .readdirSync(appOutDir)
    .filter((name) => name.toLowerCase().endsWith(".exe"))
    .map((name) => path.join(appOutDir, name))[0];
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;

  const root = context.packager.projectDir;
  const icon = path.join(root, "build", "icon.ico");
  const exe = findExecutable(context.appOutDir);

  if (!exe) throw new Error(`Cannot find Windows executable in ${context.appOutDir}`);
  if (!fs.existsSync(icon)) throw new Error(`Cannot find icon file: ${icon}`);

  await rcedit(exe, {
    icon,
    "file-version": context.packager.appInfo.version,
    "product-version": context.packager.appInfo.version,
    "version-string": {
      CompanyName: "Codex",
      FileDescription: "鹿图记",
      ProductName: "鹿图记",
      OriginalFilename: path.basename(exe)
    }
  });

  console.log(`Applied app icon to ${exe}`);
};
