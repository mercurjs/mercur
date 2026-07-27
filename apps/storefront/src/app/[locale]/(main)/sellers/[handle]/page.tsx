import { SellerTabs } from "@/components/organisms"
import { SellerPageHeader } from "@/components/sections"
import { retrieveCustomer } from "@/lib/data/customer"
import { getSellerByHandle } from "@/lib/data/seller"
import { SellerDTO } from "@mercurjs/types"

export default async function SellerPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { handle, locale } = await params
  const { page } = await searchParams

  const seller = (await getSellerByHandle(handle)) as SellerDTO

  const user = await retrieveCustomer()

  const tab = "offers"

  if (!seller) {
    return null
  }

  return (
    <main className="container">
      <SellerPageHeader header seller={seller} user={user} />
      <SellerTabs
        tab={tab}
        seller_id={seller.id}
        seller_handle={seller.handle}
        locale={locale}
        page={page ? parseInt(page, 10) : 1}
      />
    </main>
  )
}
