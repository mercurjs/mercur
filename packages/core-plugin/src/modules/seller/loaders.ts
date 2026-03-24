import { LoaderOptions } from "@medusajs/framework/types"
import { MedusaModule } from "@medusajs/framework/modules-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

export default async function sellerMemberRbacRoleLoader({}: LoaderOptions) {
  MedusaModule.setCustomLink(() => {
    return {
      isLink: true,
      isReadOnlyLink: true,
      extends: [
        {
          serviceName: MercurModules.SELLER,
          entity: "SellerMember",
          relationship: {
            serviceName: Modules.RBAC,
            entity: "RbacRole",
            primaryKey: "id",
            foreignKey: "role_id",
            alias: "rbac_role",
            isList: false,
          },
        },
      ],
    }
  })
}
