import type { MedusaContainer } from "@medusajs/framework/types"
import { seed } from "./seed"

// Entry point for `medusa exec`. Seeding runs in a full Medusa process so the
// container is resolved from one consistent module graph.
export default async function ({ container }: { container: MedusaContainer }) {
  await seed(container)
}
