import { Card, Checkbox } from "@/components/atoms"

export const ReturnMethodsTab = ({
  shippingMethods,
  handleSetReturnMethod,
  returnMethod,
  seller,
}: {
  shippingMethods: any
  handleSetReturnMethod: (method: any) => void
  returnMethod: string
  seller: any
}) => {
  const noShippingMethods = !shippingMethods?.length || false

  return (
    <>
      <div className="mb-8">
        <Card className="bg-secondary p-4">
          <p className="label-lg uppercase">Return methods</p>
        </Card>
        <Card className="flex items-center justify-between p-4">
          {noShippingMethods ? (
            <div className="py-4 text-center font-bold heading-md w-full">
              No shipping methods available
            </div>
          ) : (
            <ul>
              {shippingMethods.map((method: any) => (
                <li
                  key={method.id}
                  onClick={() => handleSetReturnMethod(method.id)}
                  className="flex items-center gap-4 my-2 cursor-pointer"
                >
                  <Checkbox checked={returnMethod === method.id} />
                  <span className="label-lg">{method.name}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div>
        <Card className="bg-secondary p-4">
          <p className="label-lg uppercase">Shipping address</p>
        </Card>
        <Card className="p-4">
          <p className="label-lg">{seller.name}</p>
          <p className="label-md">{seller.address_line}</p>
          <p className="label-md">
            {seller.city}, {seller.state}
          </p>
          <p className="label-md">
            {seller.postal_code}, {seller.country_code}
          </p>
          <p className="label-md">
            {seller.email}, {seller.phone}
          </p>
        </Card>
      </div>
    </>
  )
}
