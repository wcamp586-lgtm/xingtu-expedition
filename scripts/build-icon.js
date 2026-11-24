const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico").default;

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src", "assets", "lutuji-icon.svg");
const outDir = path.join(root, "build");
const pngDir = path.join(outDir, "icons");
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  fs.mkdirSync(pngDir, { recursive: true });

  const pngs = [];
  for (const size of sizes) {
    const pngPath = path.join(pngDir, `icon-${size}.png`);
    await sharp(source)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(pngPath);
    pngs.push(pngPath);
  }

  const ico = await pngToIco(pngs);
  fs.writeFileSync(path.join(outDir, "icon.ico"), ico);
  fs.copyFileSync(path.join(pngDir, "icon-256.png"), path.join(outDir, "icon.png"));
  console.log(`Built transparent icon: ${path.join(outDir, "icon.ico")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
