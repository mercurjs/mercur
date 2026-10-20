import type { ReactNode } from "react"
import { useExtension } from "./context"

/**
 * Wraps the panel in every registered gate, lowest `order` outermost. Gates
 * mount inside the query and extension providers but outside the router, so
 * a gate can fetch and block the whole app (terms acceptance, licence checks).
 */
export const Gates = ({ children }: { children: ReactNode }) => {
  const gates = useExtension().getGates()

  return gates.reduceRight<ReactNode>(
    (inner, { Component, id }) => <Component key={id}>{inner}</Component>,
    children
  )
}
