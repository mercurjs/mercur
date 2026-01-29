import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteCustomer } from "../../../../../hooks/api/customers"

type CustomerGeneralSectionProps = {
  customer: HttpTypes.AdminCustomer
}

export const CustomerGeneralSection = ({
  customer,
}: CustomerGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync } = useDeleteCustomer(customer.id)

  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")

  const statusColor = customer.has_account ? "green" : "orange"
  const statusText = customer.has_account
    ? t("customers.fields.registered")
    : t("customers.fields.guest")

  const handleDelete = async () => {
    const res = await prompt({
      title: t("customers.delete.title"),
      description: t("customers.delete.description", {
        email: customer.email,
      }),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: customer.email,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("customers.delete.successToast", {
            email: customer.email,
          })
        )

        navigate("/customers", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Container className="divide-y p-0" data-testid="customer-general-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="customer-general-section-header">
        <Heading data-testid="customer-general-section-email">{customer.email}</Heading>
        <div className="flex items-center gap-x-2" data-testid="customer-general-section-actions">
          <StatusBadge color={statusColor} data-testid="customer-general-section-status-badge">{statusText}</StatusBadge>
          <ActionMenu
            data-testid="customer-general-section-action-menu"
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    to: "edit",
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="customer-general-section-name-row">
        <Text size="small" leading="compact" weight="plus" data-testid="customer-general-section-name-label">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact" data-testid="customer-general-section-name-value">
          {name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="customer-general-section-company-row">
        <Text size="small" leading="compact" weight="plus" data-testid="customer-general-section-company-label">
          {t("fields.company")}
        </Text>
        <Text size="small" leading="compact" data-testid="customer-general-section-company-value">
          {customer.company_name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="customer-general-section-phone-row">
        <Text size="small" leading="compact" weight="plus" data-testid="customer-general-section-phone-label">
          {t("fields.phone")}
        </Text>
        <Text size="small" leading="compact" data-testid="customer-general-section-phone-value">
          {customer.phone || "-"}
        </Text>
      </div>
    </Container>
  )
}
