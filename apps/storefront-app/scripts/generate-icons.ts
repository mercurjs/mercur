import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(ROOT, "..", "..");

const BACKGROUND: [number, number, number] = [9, 9, 9];
const FOREGROUND: [number, number, number] = [255, 255, 255];

const M_PATH: Array<[number, number]> = [
  [240, 784],
  [240, 240],
  [348, 240],
  [512, 532],
  [676, 240],
  [784, 240],
  [784, 784],
  [684, 784],
  [684, 420],
  [592, 684],
  [512, 684],
  [340, 420],
  [340, 784],
];

const CRC_TABLE = new Uint32Array(256);

for (let n = 0; n < 256; n += 1) {
  let c = n;

  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }

  CRC_TABLE[n] = c;
}

function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, crcInput, crc]);
}

function pointInPolygon(x: number, y: number, polygon: Array<[number, number]>): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function renderPng(size: number, insetRatio: number): Buffer {
  const rows: Buffer[] = [];
  const scale = 1024 / size;
  const inset = size * insetRatio;

  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0;

    for (let x = 0; x < size; x += 1) {
      const inSafeZone =
        x >= inset && x < size - inset && y >= inset && y < size - inset;
      const px = (x + 0.5) * scale;
      const py = (y + 0.5) * scale;
      const [r, g, b] =
        inSafeZone && pointInPolygon(px, py, M_PATH) ? FOREGROUND : BACKGROUND;
      const offset = 1 + x * 3;
      row[offset] = r;
      row[offset + 1] = g;
      row[offset + 2] = b;
    }

    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = deflateSync(Buffer.concat(rows), { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array()),
  ]);
}

function writePng(path: string, size: number, insetRatio: number): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderPng(size, insetRatio));
}

const storefrontIcons = join(REPO_ROOT, "apps/storefront/public/icons");
const resources = join(ROOT, "resources");

writePng(join(storefrontIcons, "icon-192.png"), 192, 0);
writePng(join(storefrontIcons, "icon-512.png"), 512, 0);
writePng(join(storefrontIcons, "icon-512-maskable.png"), 512, 0.12);
writePng(join(storefrontIcons, "apple-touch-icon.png"), 180, 0);
writePng(join(resources, "icon.png"), 1024, 0);
writePng(join(resources, "icon-512.png"), 512, 0);

process.stdout.write(`Wrote storefront and native icons into\n  ${storefrontIcons}\n  ${resources}\n`);
