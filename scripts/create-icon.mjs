import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const assetsDir = join(rootDir, "assets");
const iconsetDir = join(assetsDir, "FocusDock.iconset");
const sourcePng = join(assetsDir, "icon.png");
const icnsPath = join(assetsDir, "icon.icns");
const tempIcnsPath = join(assetsDir, "icon.next.icns");
const size = 1024;
const pixels = Buffer.alloc(size * size * 4);

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function rgba(hex, alpha = 255) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha
  ];
}

function blendPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const index = (Math.floor(y) * size + Math.floor(x)) * 4;
  const alpha = color[3] / 255;
  const existingAlpha = pixels[index + 3] / 255;
  const nextAlpha = alpha + existingAlpha * (1 - alpha);

  if (nextAlpha === 0) {
    return;
  }

  pixels[index] = clamp((color[0] * alpha + pixels[index] * existingAlpha * (1 - alpha)) / nextAlpha);
  pixels[index + 1] = clamp((color[1] * alpha + pixels[index + 1] * existingAlpha * (1 - alpha)) / nextAlpha);
  pixels[index + 2] = clamp((color[2] * alpha + pixels[index + 2] * existingAlpha * (1 - alpha)) / nextAlpha);
  pixels[index + 3] = clamp(nextAlpha * 255);
}

function fillRoundedRect(x, y, width, height, radius, colorForPixel) {
  const maxX = x + width;
  const maxY = y + height;

  for (let py = y; py < maxY; py += 1) {
    for (let px = x; px < maxX; px += 1) {
      const cx = px < x + radius ? x + radius : px > maxX - radius ? maxX - radius : px;
      const cy = py < y + radius ? y + radius : py > maxY - radius ? maxY - radius : py;
      const distance = Math.hypot(px - cx, py - cy);

      if (distance <= radius) {
        blendPixel(px, py, colorForPixel(px, py));
      }
    }
  }
}

function fillCircle(cx, cy, radius, color) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      if (Math.hypot(x - cx, y - cy) <= radius) {
        blendPixel(x, y, color);
      }
    }
  }
}

function drawLine(x1, y1, x2, y2, width, color) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    fillCircle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
  }
}

function fillDiamond(cx, cy, radius, color) {
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (Math.abs(x - cx) + Math.abs(y - cy) <= radius) {
        blendPixel(x, y, color);
      }
    }
  }
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function writePng(filePath) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    const sourceStart = y * size * 4;
    const targetStart = y * (size * 4 + 1);
    raw[targetStart] = 0;
    pixels.copy(raw, targetStart + 1, sourceStart, sourceStart + size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  writeFileSync(filePath, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]));
}

mkdirSync(assetsDir, { recursive: true });

fillRoundedRect(92, 92, 840, 840, 210, (x, y) => {
  const t = (x + y) / (size * 2);
  return [
    Math.round(18 + 18 * t),
    Math.round(25 + 28 * t),
    Math.round(38 + 42 * t),
    255
  ];
});

fillRoundedRect(650, 178, 210, 210, 52, () => rgba("#ff725e", 255));
fillRoundedRect(682, 232, 146, 118, 26, () => rgba("#fff8f2", 245));
fillRoundedRect(682, 232, 146, 36, 18, () => rgba("#ffd166", 255));
fillCircle(718, 224, 10, rgba("#fff8f2", 255));
fillCircle(792, 224, 10, rgba("#fff8f2", 255));

drawLine(310, 378, 604, 378, 50, rgba("#f8fbff", 235));
drawLine(604, 378, 604, 672, 50, rgba("#f8fbff", 235));
drawLine(604, 672, 310, 672, 50, rgba("#f8fbff", 235));
drawLine(310, 672, 310, 378, 50, rgba("#f8fbff", 235));

drawLine(368, 535, 462, 622, 58, rgba("#6ee7b7", 255));
drawLine(462, 622, 690, 368, 58, rgba("#6ee7b7", 255));

fillDiamond(726, 704, 34, rgba("#fff0a8", 255));
fillDiamond(726, 704, 17, rgba("#ffffff", 255));

writePng(sourcePng);

rmSync(iconsetDir, { recursive: true, force: true });
mkdirSync(iconsetDir, { recursive: true });

const iconSizes = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
  [1024, "icon_512x512@2x.png"]
];

for (const [targetSize, filename] of iconSizes) {
  execFileSync("sips", ["-z", String(targetSize), String(targetSize), sourcePng, "--out", join(iconsetDir, filename)], {
    stdio: "ignore"
  });
}

rmSync(tempIcnsPath, { force: true });
try {
  execFileSync("iconutil", ["-c", "icns", iconsetDir, "-o", tempIcnsPath], { stdio: "inherit" });
  rmSync(icnsPath, { force: true });
  renameSync(tempIcnsPath, icnsPath);
} catch {
  console.warn("iconutil could not refresh assets/icon.icns; keeping assets/icon.png for packagers that can convert PNG icons.");
}
