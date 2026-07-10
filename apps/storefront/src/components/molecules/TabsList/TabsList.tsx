import { TabsTrigger } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export const TabsList = ({
  list,
  activeTab,
  "data-testid": dataTestId,
}: {
  list: { label: string; link: string }[]
  activeTab: string
  "data-testid"?: string
}) => {
  return (
    <div className="flex gap-4 w-full" data-testid={dataTestId ?? 'tabs-list'}>
      {list.map(({ label, link }) => (
        <LocalizedClientLink key={label} href={link}>
          <TabsTrigger isActive={activeTab === label.toLowerCase()}>
            {label}
          </TabsTrigger>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
