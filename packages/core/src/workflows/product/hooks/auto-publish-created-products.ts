import { IProductModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

import { resolveRequireProductApproval } from "../../../utils/require-product-approval"
import { createProductsWorkflow } from "../workflows/create-products"

type ProductsCreatedHookInput = {
  products: { id: string; status?: string }[]
}

// `createProductsWorkflow`'s exported type intentionally erases its hooks to
// `unknown[]` (see create-products.ts) to keep `tsc --declaration` able to
// name the workflow's type; that leaves `.hooks` with no named members at
// the type level even though `productsCreated` is registered at runtime.
const hooks = createProductsWorkflow.hooks as unknown as {
  productsCreated: (
    handler: (
      input: ProductsCreatedHookInput,
      context: { container: MedusaContainer }
    ) => Promise<void>
  ) => void
}

// POST /vendor/products always defaults an unspecified status to `proposed`
// (see route.ts) so that value never depends on the approval toggle. When
// approval isn't required, this hook elevates any resulting `proposed`
// product straight to `published` (MercurJS v1 auto-accept behaviour).
hooks.productsCreated(async ({ products }, { container }) => {
  const requireApproval = await resolveRequireProductApproval(container)
  if (requireApproval) {
    return
  }

  const proposedIds = products
    .filter((product) => product.status === ProductStatus.PROPOSED)
    .map((product) => product.id)

  if (!proposedIds.length) {
    return
  }

  const productModuleService = container.resolve<IProductModuleService>(
    Modules.PRODUCT
  )
  await productModuleService.updateProducts(
    { id: proposedIds },
    { status: ProductStatus.PUBLISHED }
  )
})
