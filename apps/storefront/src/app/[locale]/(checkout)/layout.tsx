import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { CollapseIcon } from "@/icons"
import Image from "next/image"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <header>
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
                priority
              />
            </LocalizedClientLink>
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
