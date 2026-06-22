import { randomUUID } from "node:crypto"

const slug = () => randomUUID().slice(0, 8)

export function generateMemberCredentials(prefix = "vendor") {
  return {
    email: `${prefix}-${Date.now()}-${slug()}@example.test`,
    password: "Password123!",
  }
}

export function generateSeller(input: {
  member_email: string
  name?: string
  email?: string
  currency_code?: string
}) {
  return {
    name: input.name ?? `Test Seller ${slug()}`,
    email: input.email ?? input.member_email,
    member_email: input.member_email,
    currency_code: input.currency_code ?? "usd",
    description: "Created by e2e-tests",
  }
}

export function generateProduct(overrides: {
  title?: string
  status?: "draft" | "published"
} = {}) {
  const title = overrides.title ?? `Test Product ${slug()}`
  return {
    title,
    handle: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    status: overrides.status ?? ("draft" as const),
  }
}
