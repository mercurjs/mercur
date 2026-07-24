"use client"
import { Button, Divider } from "@/components/atoms"
import { Modal, ReportSellerForm } from "@/components/molecules"
import { DoneIcon } from "@/icons"
import { SingleProductSeller } from "@/types/product"
import { SellerDTO } from "@mercurjs/types"
import { format } from "date-fns"
import { useState } from "react"

export const SellerFooter = ({ seller }: { seller: SellerDTO }) => {
  const [openModal, setOpenModal] = useState(false)
  return (
    <div className="flex justify-between items-center flex-col lg:flex-row p-5">
      <div className="flex gap-2 lg:gap-4 items-center label-sm lg:label-md text-secondary mb-4 lg:mb-0 justify-between w-full lg:justify-start lg:w-auto">
        <Divider square />
        {seller.created_at && (
          <p>Joined {format(new Date(seller.created_at), "yyyy-MM-dd")}</p>
        )}
      </div>
      <Button
        variant="text"
        size="large"
        className="uppercase"
        onClick={() => setOpenModal(true)}
      >
        Report Seller
      </Button>
      {openModal && (
        <Modal heading="Report seller" onClose={() => setOpenModal(false)}>
          <ReportSellerForm onClose={() => setOpenModal(false)} />
        </Modal>
      )}
    </div>
  )
}
