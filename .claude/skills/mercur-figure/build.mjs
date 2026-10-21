#!/usr/bin/env node
// node build.mjs <figure.mjs> [--out <dir>] [--look <dir>] [--width 720]
//
// Renders the figure in both themes to <out>/<name>-light.svg and
// <name>-dark.svg, checks it, and with --look also writes PNGs of each theme
// on the docs page colour at the width the docs show it.

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { Figure } from "./kit.mjs"

const PAGE = { light: "#ffffff", dark: "#0c0a12" }

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"))
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d)

if (!file) {
  console.error("usage: node build.mjs <figure.mjs> [--out <dir>] [--look <dir>] [--width 720]")
  process.exit(2)
}

const out = resolve(opt("--out", "apps/docs/images/figures"))
const look = args.includes("--look") ? resolve(opt("--look")) : null
const lookWidth = Number(opt("--width", 720))

const source = readFileSync(file, "utf8")
const spec = (await import(pathToFileURL(resolve(file)).href)).default
const failures = []

for (const k of ["name", "width", "height", "alt", "draw"])
  if (spec[k] === undefined) failures.push(`figure is missing "${k}"`)
if (spec.name && !/^[a-z0-9-]+$/.test(spec.name)) failures.push(`name "${spec.name}" is not kebab-case`)
if (/['"`]#[0-9a-f]{6}([0-9a-f]{2})?['"`]/i.test(source))
  failures.push("figure source holds a raw hex colour; use a tone (hi/text/mid/lo/green/red/amber/violet)")
if (/<\s*(rect|text|path|svg|g)\b/.test(source)) failures.push("figure source writes SVG markup; use the kit")
if (failures.length) {
  failures.forEach((f) => console.error(`FAIL ${f}`))
  process.exit(1)
}

mkdirSync(out, { recursive: true })
if (look) mkdirSync(look, { recursive: true })

const warnings = new Set()
let accent = 0
for (const theme of ["light", "dark"]) {
  const fig = new Figure({ name: spec.name, width: spec.width, height: spec.height, alt: spec.alt, theme })
  spec.draw(fig)
  fig.warnings.forEach((w) => warnings.add(w))
  accent = fig.stats.accent
  const svgPath = `${out}/${spec.name}-${theme}.svg`
  writeFileSync(svgPath, fig.svg())
  console.log(`wrote ${svgPath}`)
  if (look) {
    const png = `${look}/${spec.name}-${theme}.png`
    try {
      execFileSync("rsvg-convert", ["-w", String(lookWidth * 2), "-b", PAGE[theme], "-o", png, svgPath])
      console.log(`look  ${png}`)
    } catch {
      console.error("look  rsvg-convert not found (brew install librsvg); open the SVGs in a browser instead")
    }
  }
}

if (accent > 4) warnings.add(`violet used ${accent} times; the accent marks one place (rule 4)`)
warnings.forEach((w) => console.log(`WARN ${w}`))

const rel = (p) => p.replace(/^.*\/apps\/docs/, "")
console.log(`
<img className="block dark:hidden" src="${rel(`${out}/${spec.name}-light.svg`)}" alt="${spec.alt}" />
<img className="hidden dark:block" src="${rel(`${out}/${spec.name}-dark.svg`)}" alt="${spec.alt}" />`)
process.exit(warnings.size ? 3 : 0)
