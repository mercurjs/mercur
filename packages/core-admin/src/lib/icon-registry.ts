import { ComponentType } from "react"
import {
  Tag,
  ShoppingCart,
  Users,
  CogSixTooth,
  Star,
  Folder,
  SquaresPlus,
  CreditCard,
  Gift,
  Buildings,
  ChartBar,
  Bolt,
  CircleStack,
} from "@medusajs/icons"

export const IconRegistry: Record<string, ComponentType> = {
  "tag": Tag,
  "shopping-cart": ShoppingCart,
  "users": Users,
  "settings": CogSixTooth,
  "star": Star,
  "folder": Folder,
  "squares-plus": SquaresPlus,
  "credit-card": CreditCard,
  "gift": Gift,
  "buildings": Buildings,
  "chart-bar": ChartBar,
  "bolt": Bolt,
  "circle-stack": CircleStack,
}

export function getIcon(key?: string): ComponentType | null {
  if (!key) return null
  return IconRegistry[key] ?? null
}

export function registerIcon(key: string, icon: ComponentType): void {
  IconRegistry[key] = icon
}
