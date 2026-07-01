import { SellerInfo } from "@/components/molecules"
import { SellerProps } from "@/types/seller"
import { Chat } from "../Chat/Chat"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"

export const SellerHeading = ({
  seller,
  user,
  header,
}: {
  header: boolean
  seller: SellerProps
  user: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="border-b">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <SellerInfo header={header} seller={seller} />
        </div>
        {user && (
          <div className="flex gap-2 md:mt-0 p-5 md:ml-auto">
            <Chat
              user={user}
              seller={seller}
              buttonClassNames="uppercase h-10"
              variant="filled"
              buttonSize="small"
            />
          </div>
        )}
      </div>
      <div className="px-5 pb-5">
        <p
          dangerouslySetInnerHTML={{
            __html: seller.description,
          }}
          className="label-md"
        />
      </div>
    </div>
  )
}
