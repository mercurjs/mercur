/**
 * Single import surface for all specs. Re-exports `test` with every fixture
 * composed (auth → data → ...). Specs should import from here, not from
 * `@playwright/test` directly.
 *
 *   import { test, expect } from "../fixtures/base.fixture"
 */
export { test, expect } from "./data.fixture"
