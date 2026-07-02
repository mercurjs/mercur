import { listProductAttributes } from "@/lib/data/product-attributes"

export const ProductListingAttributes = async ({
  category_id,
}: {
  category_id?: string
}) => {
  const attributes = await listProductAttributes({ category_id })

  const withValues = attributes.filter(
    (attribute) => !!attribute?.id && (attribute.values?.length ?? 0) > 0
  )

  if (!withValues.length) return null

  return (
    <section className="mb-6" data-testid="product-listing-attributes">
      <div className="flex flex-col gap-4">
        {withValues.map((attribute) => (
          <div
            key={attribute.id}
            className="flex flex-col gap-2"
            data-testid={`product-listing-attribute-${attribute.handle ?? attribute.id}`}
          >
            <span className="label-md text-secondary">{attribute.name}</span>
            <div className="flex flex-wrap gap-2">
              {attribute.values?.map((value) => (
                <span
                  key={value.id}
                  className="border rounded-sm px-3 py-1 label-md"
                  data-testid={`product-listing-attribute-value-${value.id}`}
                >
                  {value.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
