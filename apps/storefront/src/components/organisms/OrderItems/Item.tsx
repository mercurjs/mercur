import { convertToLocale } from "@/lib/helpers/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
export const Item = ({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}) => {
  const original_total = convertToLocale({
    amount: item.original_total,
    currency_code: currencyCode,
  })

  const total = convertToLocale({
    amount: item.total,
    currency_code: currencyCode,
  })

  return (
    <div className="border rounded-sm p-1 flex gap-2">
      <div className="w-[100px] h-[132px] flex items-center justify-center">
        {item.thumbnail ? (
          <Image
            src={decodeURIComponent(item.thumbnail)}
            alt="Product thumbnail"
            width={100}
            height={132}
            className="rounded-xs w-[100px] h-[132px] object-contain"
          />
        ) : (
          <Image
            src={"/images/placeholder.svg"}
            alt="Product thumbnail"
            width={50}
            height={66}
            className="rounded-xs w-[50px] h-[66px] object-contain opacity-30"
          />
        )}
      </div>

      <div className="w-full p-2">
        <div className="flex justify-between lg:mb-4">
          <div className="w-[150px] md:w-[200px] lg:w-[300px] xl:w-[calc(100%-120px)] mb-6">
            <h3 className="heading-xs uppercase truncate">
              {item.subtitle} {item.title}
            </h3>
          </div>
        </div>
        <div className="lg:flex justify-between -mt-4 lg:mt-0">
          <div className="label-md text-secondary">
            <p>
              Quantity: <span className="text-primary">{item.quantity}</span>
            </p>
          </div>
          <div className="lg:text-right flex lg:block items-center gap-2 mt-4 lg:mt-0">
            {total !== original_total && (
              <p className="line-through text-secondary label-md">
                {original_total}
              </p>
            )}
            <p className="label-lg">{total}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
