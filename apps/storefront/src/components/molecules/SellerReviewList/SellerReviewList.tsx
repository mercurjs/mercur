"use client"

import { OrdersPagination } from "@/components/sections"
import { SellerReview } from "../SellerReview/SellerReview"
import { useSearchParams } from "next/navigation"

const LIMIT = 10

export const SellerReviewList = ({ reviews }: { reviews?: any[] }) => {
  const searchParams = useSearchParams()
  const page = searchParams.get("page") || 1

  const pages = Math.ceil((reviews?.length || 0) / LIMIT) || 1

  const filteredReviews = reviews?.slice((+page - 1) * LIMIT, +page * LIMIT)

  if (!reviews) return null

  return (
    <div className="mt-4">
      {filteredReviews?.map((review) => (
        <SellerReview key={review.id} review={review} />
      ))}

      <OrdersPagination pages={pages} />
    </div>
  )
}
