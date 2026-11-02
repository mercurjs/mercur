import { clx } from "@medusajs/ui"
import type { LayoutConfig, LayoutComponentProps } from "@mercurjs/dashboard-sdk"
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk"

export const SingleColumnLayoutComponent = ({ sections, className }: LayoutComponentProps) => (
  <div className={clx("flex flex-col gap-y-3", className)}>{sections.main}</div>
)

export const TwoColumnLayoutComponent = ({ sections, className }: LayoutComponentProps) => (
  <div
    className={clx(
      "flex w-full flex-col items-start gap-x-4 gap-y-3 xl:grid xl:grid-cols-[minmax(0,_1fr)_440px]",
      className
    )}
  >
    <div className="flex w-full min-w-0 flex-col gap-y-3">{sections.main}</div>
    <div className="flex w-full max-w-[100%] flex-col gap-y-3 xl:mt-0 xl:max-w-[440px]">
      {sections.side}
    </div>
  </div>
)

export const CORE_LAYOUTS: LayoutConfig[] = [
  {
    id: CORE_LAYOUT_IDS.SINGLE_COLUMN,
    sections: [{ id: "main" }],
    Component: SingleColumnLayoutComponent,
  },
  {
    id: CORE_LAYOUT_IDS.TWO_COLUMN,
    sections: [{ id: "main" }, { id: "side" }],
    Component: TwoColumnLayoutComponent,
  },
]
