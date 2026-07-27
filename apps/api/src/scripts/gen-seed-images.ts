import { seedCatalog, type SeedCatalogItem } from "./seed-catalog"
import { mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"

// Generates fresh product images with Google's Gemini image model ("Nano Banana",
// gemini-2.5-flash-image) from generic, brand-free text prompts only. No source
// photos are read or described, so the output references no real product design
// and carries no trademark / trade-dress ties to any actual catalog.
//
// Usage:
//   GEMINI_API_KEY=... bun run src/scripts/gen-seed-images.ts
// Optional:
//   FORCE=1   regenerate even if the file already exists

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
const IMAGE_MODEL = "gemini-2.5-flash-image"
const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
const OUT_DIR = join(import.meta.dir, "seed-images-generated")
const FORCE = process.env.FORCE === "1"
const LIMIT = Infinity

if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in the environment.")
  process.exit(1)
}

const kebab = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// Describe the object generically (never a specific real model) so the render is
// an ordinary product of its category, not a copy of any protected design.
const objectFor = (item: SeedCatalogItem): string => {
  if (item.footwear) {
    switch (item.category) {
      case "Sandals":
        return "a pair of casual slide sandals"
      case "Boots":
        return "a pair of ankle boots"
      case "Sport":
        return "a pair of athletic sport shoes"
      default:
        return "a pair of everyday sneakers"
    }
  }
  const t = item.title.toLowerCase()
  if (t.includes("bucket")) return "a bucket hat"
  if (t.includes("cap") || t.includes("hat") || t.includes("trucker")) return "a baseball cap"
  if (t.includes("wallet")) return "a leather wallet"
  if (t.includes("pouch")) return "a small pouch bag"
  return "a fashion accessory"
}

const promptFor = (item: SeedCatalogItem, index: number, total: number): string => {
  const object = objectFor(item)
  const angle =
    total > 1
      ? [
        "front three-quarter angle",
        "side profile angle",
        "top-down angle",
        "back angle",
      ][index] ?? `alternate angle ${index + 1}`
      : "front three-quarter angle"
  return [
    `Studio e-commerce product photo of ${object}, a generic unbranded design.`,
    `Color: ${item.colorway}.`,
    `Shown from a ${angle}.`,
    "Centered on a plain seamless white background, soft even studio lighting, sharp focus, high detail.",
    "No text, no logos, no brand marks, no people, no props.",
  ].join(" ")
}

async function generate(prompt: string): Promise<Buffer> {
  const res = await fetch(`${endpoint(IMAGE_MODEL)}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  }

  const json = await res.json()
  const parts = json?.candidates?.[0]?.content?.parts ?? []
  const image = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data)
  if (!image?.inlineData?.data) {
    throw new Error(`No image in response: ${JSON.stringify(json).slice(0, 300)}`)
  }
  return Buffer.from(image.inlineData.data, "base64")
}

await mkdir(OUT_DIR, { recursive: true })

const seen = new Map<string, number>()
let attempts = 0
let ok = 0
let skip = 0
let fail = 0

for (const item of seedCatalog) {
  let handle = kebab(item.title)
  const dup = seen.get(handle) ?? 0
  seen.set(handle, dup + 1)
  if (dup > 0) handle = `${handle}-${dup + 1}`

  if (attempts >= LIMIT) break

  const dir = join(OUT_DIR, handle)
  await mkdir(dir, { recursive: true })

  for (let i = 0; i < item.images.length; i++) {
    if (attempts >= LIMIT) break
    const file = join(dir, `${handle}-${i + 1}.png`)
    if (!FORCE && existsSync(file)) {
      skip++
      console.log(`• skip ${handle}/${handle}-${i + 1}.png (exists)`)
      continue
    }
    attempts++
    try {
      const buf = await generate(promptFor(item, i, item.images.length))
      await Bun.write(file, buf)
      ok++
      console.log(`✓ ${handle}/${handle}-${i + 1}.png`)
    } catch (e) {
      fail++
      console.log(`✗ ${handle}/${handle}-${i + 1}.png — ${(e as Error).message}`)
    }
  }
}

console.log(`\nDone. ${ok} generated, ${skip} skipped, ${fail} failed. → ${OUT_DIR}`)
