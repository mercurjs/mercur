import { Children, Fragment, isValidElement, ReactNode } from "react"

const hasAllowedCompositionChild = (
  node: ReactNode,
  allowedTypes: ReadonlySet<unknown>
): boolean => {
  if (!isValidElement(node)) {
    return false
  }

  if (allowedTypes.has(node.type)) {
    return true
  }

  if (node.type === Fragment) {
    const fragmentChildren = Children.toArray(node.props.children)
    return fragmentChildren.some((child) =>
      hasAllowedCompositionChild(child, allowedTypes)
    )
  }

  return false
}

export const hasExplicitCompoundComposition = (
  children: ReactNode,
  allowedTypes: readonly unknown[]
) => {
  if (Children.count(children) === 0) {
    return false
  }

  const allowedTypesSet = new Set(allowedTypes)
  return Children.toArray(children).some((child) =>
    hasAllowedCompositionChild(child, allowedTypesSet)
  )
}

