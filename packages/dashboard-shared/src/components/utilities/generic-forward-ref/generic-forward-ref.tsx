import {
  ForwardRefRenderFunction,
  PropsWithoutRef,
  ReactNode,
  Ref,
  RefAttributes,
  forwardRef,
} from "react"

export function genericForwardRef<T, P = {}>(
  render: (props: P, ref: Ref<T>) => ReactNode
): (props: P & RefAttributes<T>) => ReactNode {
  return forwardRef(
    render as unknown as ForwardRefRenderFunction<T, PropsWithoutRef<P>>
  ) as unknown as (props: P & RefAttributes<T>) => ReactNode
}
