"use client"

import { Button } from "@/components/atoms"
import Link from "next/link"

export const OrderReturn = ({ order }: { order: any }) => {
  return (
    <div className="md:flex justify-between items-center">
      <div className="mb-4 md:mb-0">
        <h2 className="text-primary label-lg uppercase">Return Order</h2>
        <p className="text-secondary label-md max-w-sm">
          Once you receive your order, you will have [14] days to return items.
          Find out more about{" "}
          <Link href="/returns" className="underline">
            returns and refunds
          </Link>
          .
        </p>
      </div>
      <Link href={`/user/orders/${order.id}/return`}>
        <Button variant="tonal" className="uppercase" onClick={() => null}>
          Return
        </Button>
      </Link>
    </div>
  )
}
