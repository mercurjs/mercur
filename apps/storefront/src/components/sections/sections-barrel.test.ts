import { describe, expect, test } from "bun:test"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = dirname(fileURLToPath(import.meta.url))

describe("sections barrel isolation", () => {
  test("does not re-export ProductDetailsPage (uses next/headers)", async () => {
    const source = await Bun.file(join(ROOT, "index.ts")).text()

    expect(source).not.toContain("ProductDetailsPage")
  })

  test("client SellerReviewList does not import the sections barrel", async () => {
    const source = await Bun.file(
      join(ROOT, "../molecules/SellerReviewList/SellerReviewList.tsx")
    ).text()

    expect(source).not.toMatch(/from ["']@\/components\/sections["']/)
    expect(source).toContain(
      "@/components/organisms/OrdersPagination/OrdersPagination"
    )
  })
})
