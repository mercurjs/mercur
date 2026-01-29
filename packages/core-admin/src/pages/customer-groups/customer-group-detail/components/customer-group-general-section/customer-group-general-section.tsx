import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteCustomerGroup } from "../../../../../hooks/api/customer-groups"

type CustomerGroupGeneralSectionProps = {
  group: HttpTypes.AdminCustomerGroup
}

export const CustomerGroupGeneralSection = ({
  group,
}: CustomerGroupGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { mutateAsync } = useDeleteCustomerGroup(group.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("customerGroups.delete.title"),
      description: t("customerGroups.delete.description", {
        name: group.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("customerGroups.delete.successToast", {
            name: group.name,
          })
        )

        navigate("/customer-groups", { replace: true })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <Container className="divide-y p-0" data-testid="customer-group-general-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="customer-group-general-section-header">
        <Heading data-testid="customer-group-general-section-name">{group.name}</Heading>
        <ActionMenu
          data-testid="customer-group-general-section-action-menu"
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `/customer-groups/${group.id}/edit`,
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="customer-group-general-section-customers-row">
        <Text size="small" leading="compact" weight="plus" data-testid="customer-group-general-section-customers-label">
          {t("customers.domain")}
        </Text>
        <Text size="small" leading="compact" data-testid="customer-group-general-section-customers-value">
          {group.customers?.length || "-"}
        </Text>
      </div>
    </Container>
  )
}
