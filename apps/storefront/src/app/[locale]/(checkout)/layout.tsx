import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ThemeToggle } from "@/components/molecules/ThemeToggle/ThemeToggle"
import { CollapseIcon } from "@/icons"
import { NOINDEX_ROBOTS } from "@/lib/helpers/seo"
import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <header className="glass-surface">
        <div className="relative w-full py-2 lg:px-8 px-4">
          <div className="absolute top-3">
            <LocalizedClientLink href="/cart">
              <Button variant="tonal" className="flex items-center gap-2">
                <CollapseIcon className="rotate-90" />
                <span className="hidden lg:block">Back to cart</span>
              </Button>
            </LocalizedClientLink>
          </div>
          <div className="flex items-center justify-center pl-4 lg:pl-0 w-full">
            <LocalizedClientLink href="/" className="text-2xl font-bold">
              <Image
                src="/Logo.svg"
                width={126}
                height={40}
                alt="Logo"
                className="dark:invert"
                priority
              />
            </LocalizedClientLink>
          </div>
          <div className="absolute top-3 right-4 lg:right-8 text-primary">
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
