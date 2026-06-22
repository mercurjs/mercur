import type { APIRequestContext } from "@playwright/test"

const API_URL = process.env.API_URL ?? "http://localhost:9000"

export type AuthedClient = {
  request: APIRequestContext
  token: string
  sellerId?: string
}

export type RegisteredMember = {
  email: string
  password: string
  token: string
}

export type Seller = {
  id: string
  name: string
  email: string
}

export type Product = {
  id: string
  title: string
  handle: string
}

/**
 * Register a vendor member identity. Returns the auth token used to exchange
 * for a session cookie or to authorize seller creation.
 */
export async function registerMember(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<RegisteredMember> {
  const res = await request.post(
    `${API_URL}/auth/member/emailpass/register`,
    { data: credentials },
  )
  if (!res.ok()) {
    throw new Error(
      `registerMember failed: ${res.status()} ${await res.text()}`,
    )
  }
  const body = (await res.json()) as { token: string }
  return { ...credentials, token: body.token }
}

/**
 * Log in an existing member by email/password. Returns a fresh auth token.
 */
export async function loginMember(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API_URL}/auth/member/emailpass`, {
    data: credentials,
  })
  if (!res.ok()) {
    throw new Error(`loginMember failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { token: string }
  return body.token
}

/**
 * Exchange a bearer token for a session cookie on the API origin.
 * Subsequent `request.*` calls in the same context will be authenticated.
 */
export async function openSession(
  request: APIRequestContext,
  token: string,
): Promise<void> {
  const res = await request.post(`${API_URL}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok()) {
    throw new Error(`openSession failed: ${res.status()} ${await res.text()}`)
  }
}

/**
 * Create a seller linked to the currently-authenticated member.
 * Requires `openSession` to have been called first.
 *
 * Required fields per `packages/core/.../vendor/sellers/validators.ts`:
 *   name, email, member_email, currency_code
 */
export async function createSeller(
  request: APIRequestContext,
  payload: {
    name: string
    email: string
    member_email: string
    currency_code: string
    description?: string
  },
): Promise<Seller> {
  const res = await request.post(`${API_URL}/vendor/sellers`, {
    data: payload,
  })
  if (!res.ok()) {
    throw new Error(`createSeller failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { seller: Seller }
  return body.seller
}

/**
 * Mark the given seller as the "active" seller on the current session.
 * The API stores it on `req.session.seller_id`; the vendor SPA's
 * `useMe()` hook (and `ProtectedRoute`) depends on this being set.
 */
export async function selectSeller(
  request: APIRequestContext,
  sellerId: string,
): Promise<void> {
  const res = await request.post(`${API_URL}/vendor/sellers/select`, {
    data: { seller_id: sellerId },
  })
  if (!res.ok()) {
    throw new Error(`selectSeller failed: ${res.status()} ${await res.text()}`)
  }
}

/**
 * Create a product owned by the authenticated seller.
 */
export async function createProduct(
  request: APIRequestContext,
  payload: { title: string; handle?: string; status?: "draft" | "published" },
): Promise<Product> {
  const res = await request.post(`${API_URL}/vendor/products`, {
    data: { status: "draft", ...payload },
  })
  if (!res.ok()) {
    throw new Error(`createProduct failed: ${res.status()} ${await res.text()}`)
  }
  const body = (await res.json()) as { product: Product }
  return body.product
}

/**
 * Delete a product. Swallow failures so teardown never masks a test failure.
 */
export async function deleteProduct(
  request: APIRequestContext,
  id: string,
): Promise<void> {
  try {
    await request.delete(`${API_URL}/vendor/products/${id}`)
  } catch {
    // Best-effort cleanup — log but do not throw.
  }
}
