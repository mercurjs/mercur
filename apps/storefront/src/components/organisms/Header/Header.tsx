import Image from "next/image"
import { Suspense } from "react"
import { HttpTypes } from "@medusajs/types"

import { CartButton } from '@/components/cells/CartButton/CartButton';
import { MobileNavbar } from '@/components/cells/MobileNavbar/MobileNavbar';
import { Navbar } from '@/components/cells/Navbar/Navbar';
import { CartIcon } from "@/icons"
import CountrySelector from "@/components/molecules/CountrySelector/CountrySelector"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listCategories } from "@/lib/data/categories"
import { listRegions } from "@/lib/data/regions"
import { ParentCategoryLinks } from "@/components/molecules/ParentCategoryLinks/ParentCategoryLinks"
import { HeaderAccount, HeaderAccountFallback } from "./HeaderAccount"

export const Header = async () => {
  const [regions, { categories, parentCategories }] = await Promise.all([
    listRegions(),
    listCategories({ query: { include_ancestors_tree: true } }) as Promise<{
      categories: HttpTypes.StoreProductCategory[]
      parentCategories: HttpTypes.StoreProductCategory[]
    }>,
  ])
  return (
    <header data-testid="header">
      <div className="flex py-2 lg:px-8 px-4 md:px-5" data-testid="header-top">
        <div className="flex items-center lg:w-1/3">
          <MobileNavbar
            parentCategories={parentCategories}
            categories={categories}
          />
          <ParentCategoryLinks
            parentCategories={parentCategories}
            categories={categories}
          />
        </div>
        <div className="flex lg:justify-center lg:w-1/3 items-center pl-4 lg:pl-0">
          <LocalizedClientLink href="/" className="text-2xl font-bold" data-testid="header-logo-link">
            <Image
              src="/Logo.svg"
              width={126}
              height={40}
              alt="Logo"
              priority
            />
          </LocalizedClientLink>
        </div>
        <div className="flex items-center justify-end gap-2 lg:gap-4 w-full lg:w-1/3 py-2" data-testid="header-actions">
          <CountrySelector regions={regions} />
          <Suspense fallback={<HeaderAccountFallback />}>
            <HeaderAccount />
          </Suspense>
          <Suspense
            fallback={
              <LocalizedClientLink href="/cart" aria-label="Go to cart" className="flex">
                <CartIcon size={20} />
              </LocalizedClientLink>
            }
          >
            <CartButton />
          </Suspense>
        </div>
      </div>
      <Navbar categories={categories} parentCategories={parentCategories} />
    </header>
  )
}
