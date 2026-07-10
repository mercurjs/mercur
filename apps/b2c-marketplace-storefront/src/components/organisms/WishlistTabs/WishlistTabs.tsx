import { TabsContent, TabsList } from "@/components/molecules"
import { Suspense } from "react"
// import { ProductsList } from "../ProductsList/ProductsList"
import { ProductsPagination } from "../ProductsPagination/ProductsPagination"
// import { listProducts } from "@/lib/data/products"

export const wishlistTabs = [
  { label: "All", link: "/wishlist" },
  { label: "Products", link: "/wishlist/products" },
  { label: "Collections", link: "/wishlist/collections" },
]

export const WishlistTabs = async ({ tab }: { tab: string }) => {
  // const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "gb"

  // const { response } = await listProducts({
  //   countryCode: DEFAULT_REGION,
  // })
  // const { products } = await response

  return (
    <div>
      <TabsList list={wishlistTabs} activeTab={tab} />
      <TabsContent value="all" activeTab={tab}>
        <Suspense fallback={<>Loading...</>}>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
            {/* <ProductsList products={products} /> */}
          </div>
          <ProductsPagination pages={2} />
        </Suspense>
      </TabsContent>
      <TabsContent value="products" activeTab={tab}>
        <Suspense fallback={<>Loading...</>}>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
            {/* <ProductsList products={products} /> */}
          </div>
          <ProductsPagination pages={2} />
        </Suspense>
      </TabsContent>
      <TabsContent value="collections" activeTab={tab}>
        <Suspense fallback={<>Loading...</>}>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 mt-8">
            {/* <ProductsList products={products} /> */}
          </div>
          <ProductsPagination pages={2} />
        </Suspense>
      </TabsContent>
    </div>
  )
}
