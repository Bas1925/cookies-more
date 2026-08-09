import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const brick = "#964534";
const cream = "#f3e6d4";

const cookieDots = (cx, cy, scale = 1) => `
  <circle cx="${cx - 18 * scale}" cy="${cy - 22 * scale}" r="${7 * scale}" />
  <circle cx="${cx + 18 * scale}" cy="${cy - 18 * scale}" r="${6 * scale}" />
  <circle cx="${cx - 24 * scale}" cy="${cy + 16 * scale}" r="${6 * scale}" />
  <circle cx="${cx + 20 * scale}" cy="${cy + 20 * scale}" r="${8 * scale}" />
  <circle cx="${cx + 2 * scale}" cy="${cy + 2 * scale}" r="${5 * scale}" />`;

const brandMarkSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="92" fill="${brick}"/>
  <defs>
    <mask id="bite">
      <circle cx="246" cy="262" r="164" fill="white"/>
      <circle cx="375" cy="141" r="76" fill="black"/>
      <circle cx="410" cy="220" r="50" fill="black"/>
    </mask>
  </defs>
  <circle cx="246" cy="262" r="164" fill="${cream}" mask="url(#bite)"/>
  <g fill="${brick}">
    <circle cx="185" cy="182" r="18"/>
    <circle cx="272" cy="166" r="15"/>
    <circle cx="155" cy="278" r="16"/>
    <circle cx="249" cy="257" r="19"/>
    <circle cx="321" cy="309" r="21"/>
    <circle cx="208" cy="351" r="17"/>
  </g>
</svg>`;

const googleLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="${brick}"/>
  <defs>
    <mask id="logo-bite">
      <circle cx="246" cy="154" r="88" fill="white"/>
      <circle cx="316" cy="89" r="41" fill="black"/>
      <circle cx="334" cy="132" r="28" fill="black"/>
    </mask>
  </defs>
  <circle cx="246" cy="154" r="88" fill="${cream}" mask="url(#logo-bite)"/>
  <g fill="${brick}">${cookieDots(240, 158, 0.9)}</g>
  <text x="256" y="334" text-anchor="middle" fill="${cream}" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700" letter-spacing="5">COOKIES</text>
  <text x="256" y="414" text-anchor="middle" fill="${cream}" font-family="Arial, sans-serif" font-size="50" font-weight="700" letter-spacing="6">&amp; MORE</text>
</svg>`;

function pngAsIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0);
  entry.writeUInt8(size >= 256 ? 0 : size, 1);
  entry.writeUInt16LE(0, 2);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

const icon512 = await sharp(Buffer.from(brandMarkSvg)).png().toBuffer();
const apple180 = await sharp(Buffer.from(brandMarkSvg)).resize(180, 180).png().toBuffer();
const favicon64 = await sharp(Buffer.from(brandMarkSvg)).resize(64, 64).png().toBuffer();
const googleLogo512 = await sharp(Buffer.from(googleLogoSvg)).png().toBuffer();

await Promise.all([
  writeFile(path.join(root, "src/app/icon.png"), icon512),
  writeFile(path.join(root, "src/app/apple-icon.png"), apple180),
  writeFile(path.join(root, "src/app/favicon.ico"), pngAsIco(favicon64, 64)),
  writeFile(path.join(root, "public/logo-google.png"), googleLogo512),
]);

console.log("Generated favicon, app icons, and Google logo.");
