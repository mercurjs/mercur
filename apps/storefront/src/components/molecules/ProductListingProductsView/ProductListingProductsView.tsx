import { HttpTypes } from "@medusajs/types"
import { ProductCard } from "@/components/organisms"

interface Props {
  products: HttpTypes.StoreProduct[]
}

const ProductListingProductsView = ({ products }: Props) => (
  <div className="w-full">
    <ul className="flex flex-wrap gap-4">
      {products.map(
        (product) =>
           (
            <li key={product.id} className="w-full lg:w-[calc(25%-1rem)] min-w-[250px]">
              <ProductCard
                product={product}
                className="w-full h-full lg:w-full min-w-0"
              />
            </li>
          )
      )}
    </ul>
  </div>
)

export default ProductListingProductsView
