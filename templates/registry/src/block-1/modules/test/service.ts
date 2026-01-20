import { MedusaService } from "@medusajs/framework/utils"
import Test from "./models/test"

class TestModuleService extends MedusaService({
  Test,
}) {}

export default TestModuleService
