import type { MedusaContainer } from "@medusajs/framework/types"
import { seedGuides } from "./guide-seed"

// Entry point for `medusa exec` (invoked by the stack via runSeed). Seeding runs
// in a full Medusa process so the container is resolved from one module graph.
export default async function ({ container }: { container: MedusaContainer }) {
  await seedGuides(container)
}
