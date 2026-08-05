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
