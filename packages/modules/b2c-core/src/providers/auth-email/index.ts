import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { EmailPasswordAuthService } from "./service"

const services = [EmailPasswordAuthService]

export default ModuleProvider(Modules.AUTH, {
  services,
})
