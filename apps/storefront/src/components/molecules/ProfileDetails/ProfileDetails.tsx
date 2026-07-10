"use client"
import { Button, Card } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { Modal } from "../Modal/Modal"
import { useState } from "react"
import { ProfileDetailsForm } from "../ProfileDetailsForm/ProfileDetailsForm"
import { Divider, Heading } from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"

export const ProfileDetails = ({ user }: { user: HttpTypes.StoreCustomer }) => {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <Card className="bg-secondary p-4 flex justify-between items-center" data-testid="profile-details-header">
        <Heading level="h2" className="heading-sm uppercase" data-testid="profile-details-heading">
          Profile details
        </Heading>
        <Button
          variant="tonal"
          onClick={() => setShowForm(true)}
          className="uppercase flex items-center gap-2 font-semibold"
          data-testid="profile-edit-button"
        >
          <PencilSquare />
          Edit details
        </Button>
      </Card>
      <Card className="p-0" data-testid="profile-details-info">
        <div className="p-4" data-testid="profile-name">
          <p className="label-md text-secondary" data-testid="profile-name-label">Name</p>
          <p className="label-lg text-primary" data-testid="profile-name-value">
            {`${user.first_name} ${user.last_name}`}
          </p>
        </div>
        <Divider />
        <div className="p-4" data-testid="profile-email">
          <p className="label-md text-secondary" data-testid="profile-email-label">Email</p>
          <p className="label-lg text-primary" data-testid="profile-email-value">{user.email}</p>
        </div>
        <Divider />
        <div className="p-4" data-testid="profile-phone">
          <p className="label-md text-secondary" data-testid="profile-phone-label">Phone number</p>
          <p className="label-lg text-primary" data-testid="profile-phone-value">{user.phone}</p>
        </div>
      </Card>
      {showForm && (
        <Modal
          heading="Edit profile details"
          onClose={() => setShowForm(false)}
        >
          <ProfileDetailsForm
            handleClose={() => setShowForm(false)}
            defaultValues={{
              firstName: user.first_name || "",
              lastName: user.last_name || "",
              phone: user.phone || "",
              email: user.email || "",
            }}
          />
        </Modal>
      )}
    </>
  )
}
