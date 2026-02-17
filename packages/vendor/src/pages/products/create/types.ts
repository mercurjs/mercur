import { ReactNode } from "react"
import { z } from "zod"

import { TabDefinition as GenericTabDefinition } from "@components/tabbed-form"

import { ProductCreateSchema } from "./constants"

export type ProductCreateSchemaType = z.infer<typeof ProductCreateSchema>

export type TabDefinition = GenericTabDefinition<ProductCreateSchemaType>

export interface TabProps extends Partial<TabDefinition> {
  children?: ReactNode
}
