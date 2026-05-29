import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Initial migration for the `product-change` module — intentionally empty.
 *
 * The legacy Mercur product module already creates and manages the
 * `product_change` / `product_change_action` tables; this module is being
 * scaffolded so its `Module.linkable.*` exports are available to link files
 * and joiner configuration. The cutover that re-points these tables onto
 * this module (and runs the `requires_action` re-stamp described in
 * SPEC-008) lands in a later session.
 */
export class Migration20260528000000 extends Migration {
  override async up(): Promise<void> {}
  override async down(): Promise<void> {}
}
