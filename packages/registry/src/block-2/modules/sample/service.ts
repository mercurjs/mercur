import { MedusaService } from "@medusajs/framework/utils"
import Sample from "./models/sample"

class SampleModuleService extends MedusaService({
  Sample,
}) {}

export default SampleModuleService
