import type { SeedCatalogItem } from "./seed-catalog"

type CategoryCopy = {
  story: string
  highlights: string[]
  materials: string[]
  fit: string
  care: string[]
  quote: string
}

const COPY: Record<SeedCatalogItem["category"], CategoryCopy> = {
  Sandals: {
    story:
      "Built for long summer days, this sandal pairs a contoured footbed with adjustable straps so it moulds to your foot over the first few wears. The outsole is flexible enough for city walking yet grippy on wet boardwalks and poolside tiles.",
    highlights: [
      "Anatomically shaped footbed with deep heel cup and raised toe bar",
      "Adjustable buckles for a secure, personalised fit",
      "Lightweight EVA outsole with slip-resistant tread",
      "Breathable suede lining that wicks moisture",
    ],
    materials: [
      "Upper: premium leather or vegan microfibre, depending on colourway",
      "Footbed: cork and natural latex blend",
      "Outsole: EVA",
    ],
    fit: "True to size. If you are between sizes, choose the smaller one: the footbed relaxes slightly with wear.",
    care: [
      "Wipe the upper with a soft, damp cloth.",
      "Let the sandal dry naturally, away from direct heat.",
      "Reseal the cork edge every few months to keep it supple.",
    ],
    quote: "The kind of sandal you forget you are wearing until someone asks where you got it.",
  },
  Sneakers: {
    story:
      "A modern take on a heritage silhouette, reworked with a cushioned midsole and a padded collar for all-day comfort. It is equally at home on the commute, at the office or on a weekend city break.",
    highlights: [
      "Cushioned midsole that absorbs impact without feeling mushy",
      "Padded collar and tongue for a locked-in feel",
      "Durable rubber cupsole with herringbone traction",
      "Removable insole that works with custom orthotics",
    ],
    materials: [
      "Upper: canvas, suede or leather overlays",
      "Lining: recycled polyester mesh",
      "Outsole: vulcanised natural rubber",
    ],
    fit: "True to size with a medium width. For wide feet, go half a size up.",
    care: [
      "Brush off dry dirt before cleaning.",
      "Spot clean with mild soap and lukewarm water.",
      "Stuff with paper and air dry; never put them in the dryer.",
    ],
    quote: "Clean lines, honest materials and a sole that goes the distance.",
  },
  Boots: {
    story:
      "Designed for changing seasons, this boot combines a water-resistant upper with a warm lining and a lug sole that grips on wet leaves and cobblestones. It breaks in quickly and only gets better with age.",
    highlights: [
      "Water-resistant upper with sealed seams",
      "Warm, breathable lining for cold mornings",
      "Deep-lug rubber outsole for traction on uneven ground",
      "Pull tab and side zip for easy on and off",
    ],
    materials: [
      "Upper: waxed leather or suede",
      "Lining: wool blend",
      "Outsole: high-abrasion rubber",
    ],
    fit: "Runs slightly large. Choose half a size down if you plan to wear thin socks.",
    care: [
      "Remove mud with a stiff brush once dry.",
      "Condition the leather every season.",
      "Use a waterproofing spray before the first wear.",
    ],
    quote: "Made for the walk home in the rain, and every walk after that.",
  },
  Sport: {
    story:
      "Engineered for movement, this shoe balances responsive cushioning with a stable base so you can switch between training, running and recovery without changing pairs. The knit upper stretches where you need it and supports where you do not.",
    highlights: [
      "Responsive foam midsole with energy return",
      "Engineered knit upper for targeted breathability",
      "Heel counter that keeps your stride stable",
      "Reflective details for low-light visibility",
    ],
    materials: [
      "Upper: engineered knit with TPU overlays",
      "Midsole: responsive EVA foam",
      "Outsole: carbon rubber in high-wear zones",
    ],
    fit: "True to size with a snug midfoot. Try a half size up for long-distance runs.",
    care: [
      "Loosen the laces fully before taking them off.",
      "Hand wash the upper; remove the insole to dry it separately.",
      "Rotate with a second pair to let the foam recover.",
    ],
    quote: "Light enough for race day, tough enough for every day in between.",
  },
  Accessories: {
    story:
      "The finishing touch for your favourite pair. Thoughtfully designed and made to last, this accessory keeps your footwear looking and feeling its best, season after season.",
    highlights: [
      "Designed to fit most shoe sizes and styles",
      "Durable construction for everyday use",
      "Compact enough to take anywhere",
      "Packaged in recyclable materials",
    ],
    materials: [
      "Main material: recycled and responsibly sourced fibres",
      "Details: metal or natural fittings",
    ],
    fit: "One size fits most. See the size guide for exact dimensions.",
    care: [
      "Clean with a dry or slightly damp cloth.",
      "Store in a cool, dry place.",
    ],
    quote: "Small details that make a big difference.",
  },
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

const list = (tag: "ul" | "ol", items: string[]) =>
  `<${tag}>${items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("")}</${tag}>`

export const buildProductDescription = (item: SeedCatalogItem): string => {
  const copy = COPY[item.category]
  const title = escapeHtml(item.title)
  const image = item.images[0]

  return [
    `<p>${escapeHtml(item.description)} ${escapeHtml(copy.story)}</p>`,
    image ? `<p><img src="${escapeHtml(image)}" alt="${title}"></p>` : "",
    `<h2>Why you will love it</h2>`,
    list("ul", copy.highlights),
    `<blockquote><p>${escapeHtml(copy.quote)}</p></blockquote>`,
    `<h2>Materials</h2>`,
    list("ul", copy.materials),
    `<p>Colourway: <strong>${escapeHtml(item.colorway)}</strong>. Designed by <em>${escapeHtml(item.brand)}</em>.</p>`,
    `<h3>Size and fit</h3>`,
    `<p>${escapeHtml(copy.fit)}</p>`,
    `<h3>Care instructions</h3>`,
    list("ol", copy.care),
  ].join("")
}
