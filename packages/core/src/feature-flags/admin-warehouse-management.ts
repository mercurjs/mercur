import { FlagSettings } from "@medusajs/framework/feature-flags"

const AdminWarehouseManagementFeatureFlag: FlagSettings = {
  key: "admin_warehouse_management",
  default_val: false,
  env_key: "MEDUSA_FF_ADMIN_WAREHOUSE_MANAGEMENT",
  description:
    "Enable admin-managed fulfillment (FBA-style opt-in). Default: off — baseline Mercur is seller-owned fulfillment.",
}

export default AdminWarehouseManagementFeatureFlag
