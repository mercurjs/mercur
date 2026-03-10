import { DashboardModuleOptions } from "@mercurjs/types"
import { DashboardBase } from "../../../utils/dashboard/dashboard-base"

export default class VendorUIModuleService extends DashboardBase {
    protected readonly appName = "Vendor"

    constructor(container, options: DashboardModuleOptions) {
        super(container, {
            ...options,
            viteDevServerPort: options.viteDevServerPort ?? 7001
        })
    }
}
