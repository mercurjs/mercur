"use client"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { EmblaCarouselType } from "embla-carousel"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Indicator } from "@/components/atoms"
import useEmblaCarousel from "embla-carousel-react"

export const ProductCarouselIndicator = ({
  slides = [],
  embla: parentEmbla,
}: {
  slides: HttpTypes.StoreProduct["images"]
  embla?: EmblaCarouselType
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: "y",
    loop: true,
    align: "start",
  })

  const changeSlideHandler = useCallback(
    (index: number) => {
      if (!parentEmbla) return
      parentEmbla.scrollTo(index)

      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [parentEmbla, emblaApi]
  )

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!parentEmbla) return

    onSelect(parentEmbla)
    parentEmbla.on("reInit", onSelect).on("select", onSelect)
  }, [parentEmbla, onSelect])

  return (
    <div className="embla__dots absolute lg:top-3 bottom-3 lg:bottom-auto left-3 w-[calc(100%-24px)] h-[2px] pointer-events-none">
      <div className="lg:hidden pointer-events-auto">
        <Indicator
          step={selectedIndex + 1}
          size="large"
          maxStep={slides?.length || 0}
        />
      </div>

      <div className="embla relative hidden lg:block pointer-events-auto">
        <div
          className="embla__viewport overflow-hidden rounded-xs"
          ref={emblaRef}
        >
          <div className="embla__container h-[350px] lg:h-[680px] flex lg:block">
            {(slides || []).map((slide, index) => (
              <div
                key={slide.id}
                className="mb-3 rounded-sm cursor-pointer w-16 h-16 bg-primary hidden lg:block"
                onClick={() => changeSlideHandler(index)}
              >
                <Image
                  src={decodeURIComponent(slide.url)}
                  alt="Product carousel Indicator"
                  width={64}
                  height={64}
                  className={cn(
                    "rounded-sm border-2 transition-color duration-300 hidden lg:block w-16 h-16 object-cover",
                    selectedIndex === index
                      ? "border-primary"
                      : "border-tertiary"
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
