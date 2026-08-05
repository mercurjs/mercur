// Known logins the guide generator uses to drive each panel. These match the
// data the guide seed creates (see guide-seed.ts):
//   - the admin user is created by createAdminUser (helpers/create-admin-user.ts)
//   - the seller is the primary demo seller from apps/api/src/scripts/seed.ts
export const GUIDE_ADMIN = {
  email: "admin@medusa.js",
  password: "somepassword",
}

export const GUIDE_SELLER = {
  email: "seller@mercur.dev",
  password: "supersecret",
  // After login the vendor panel shows /store-select; this is the primary demo
  // seller's store name (from apps/api/src/scripts/seed.ts) that loginToPanel
  // clicks to set the active-store context.
  store: "Sole Society",
}

// A storefront customer created by guide-seed.ts so global-setup can place an
// order over the store API. Order guides then have a real order to screenshot.
export const GUIDE_CUSTOMER = {
  email: "customer@mercur.dev",
  password: "supersecret",
  first_name: "Demo",
  last_name: "Customer",
}
