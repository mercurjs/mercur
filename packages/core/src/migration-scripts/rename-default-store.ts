import { ExecArgs, IStoreModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

const DEFAULT_STORE_NAME = "Medusa Store"
const MERCUR_STORE_NAME = "Mercur Marketplace"

export default async function renameDefaultStore({ container }: ExecArgs) {
  const storeService = container.resolve<IStoreModuleService>(Modules.STORE)

  const stores = await storeService.listStores({ name: DEFAULT_STORE_NAME })

  await storeService.updateStores(stores[0].id, { name: MERCUR_STORE_NAME })
}
