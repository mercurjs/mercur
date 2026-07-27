"use client"

import useEmblaCarousel from "embla-carousel-react"

import { Indicator } from "@/components/atoms"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"
import { useCallback, useEffect, useState } from "react"
import { EmblaCarouselType } from "embla-carousel"
import tailwindConfig from "../../../../tailwind.config"

export const CustomCarousel = ({
  variant = "light",
  items,
  align = "start",
}: {
  variant?: "light" | "dark"
  items: React.ReactNode[]
  align?: "center" | "start" | "end"
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const maxStep = items.length

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onSelect(emblaApi)
    emblaApi.on("reInit", onSelect).on("select", onSelect)
  }, [emblaApi, onSelect])

  const changeSlideHandler = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const arrowColor = {
    light: tailwindConfig.theme.extend.colors.primary,
    dark: tailwindConfig.theme.extend.colors.tertiary,
  }

  return (
    <div className="embla relative w-full flex justify-center">
      <div
        className="embla__viewport overflow-hidden rounded-xs w-full xl:flex xl:justify-center"
        ref={emblaRef}
      >
        <div className="embla__container flex">
          {items.map((slide) => slide)}
        </div>

        <div className="flex justify-between items-center mt-4 sm:hidden">
          <div className="w-1/2">
            <Indicator
              variant={variant}
              maxStep={maxStep}
              step={selectedIndex + 1}
            />
          </div>
          <div>
            <button onClick={() => changeSlideHandler(selectedIndex - 1)}>
              <ArrowLeftIcon color={arrowColor[variant]} />
            </button>
            <button onClick={() => changeSlideHandler(selectedIndex + 1)}>
              <ArrowRightIcon color={arrowColor[variant]} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
