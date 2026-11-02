import { SellerFooter } from '@/components/organisms/SellerFooter/SellerFooter';
import { SellerHeading } from '@/components/organisms/SellerHeading/SellerHeading';
import { HttpTypes } from "@medusajs/types"

export const SellerPageHeader = ({
  header = false,
  seller,
  user,
}: {
  header?: boolean
  seller: any
  user: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="border rounded-sm">
      <SellerHeading header seller={seller} user={user} />
      <SellerFooter seller={seller} />
    </div>
  )
}
