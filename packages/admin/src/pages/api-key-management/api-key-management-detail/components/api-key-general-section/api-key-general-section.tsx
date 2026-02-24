import { PencilSquare, Trash, XCircle } from "@medusajs/icons"
import { ApiKeyDTO } from "@medusajs/types"
import {
  Badge,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  Action,
  ActionMenu,
} from "../../../../../components/common/action-menu"
import { Skeleton } from "../../../../../components/common/skeleton"
import { UserLink } from "../../../../../components/common/user-link"
import {
  useDeleteApiKey,
  useRevokeApiKey,
} from "../../../../../hooks/api/api-keys"
import { useUser } from "../../../../../hooks/api/users"
import { useDate } from "../../../../../hooks/use-date"
import {
  getApiKeyStatusProps,
  getApiKeyTypeProps,
  prettifyRedactedToken,
} from "../../../common/utils"

type ApiKeyGeneralSectionProps = {
  apiKey: ApiKeyDTO
}

export const ApiKeyGeneralSection = ({ apiKey }: ApiKeyGeneralSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { getFullDate } = useDate()

  const { mutateAsync: revokeAsync } = useRevokeApiKey(apiKey.id)
  const { mutateAsync: deleteAsync } = useDeleteApiKey(apiKey.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("apiKeyManagement.delete.warning", {
        title: apiKey.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("apiKeyManagement.delete.successToast", {
            title: apiKey.title,
          })
        )
        navigate("..", { replace: true })
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  const handleRevoke = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("apiKeyManagement.revoke.warning", {
        title: apiKey.title,
      }),
      confirmText: t("apiKeyManagement.actions.revoke"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await revokeAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("apiKeyManagement.revoke.successToast", {
            title: apiKey.title,
          })
        )
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  const dangerousActions: Action[] = [
    {
      icon: <Trash />,
      label: t("actions.delete"),
      onClick: handleDelete,
      disabled: !apiKey.revoked_at,
    },
  ]

  if (!apiKey.revoked_at) {
    dangerousActions.unshift({
      icon: <XCircle />,
      label: t("apiKeyManagement.actions.revoke"),
      onClick: handleRevoke,
      disabled: !!apiKey.revoked_at,
    })
  }

  const apiKeyStatus = getApiKeyStatusProps(apiKey.revoked_at, t)
  const apiKeyType = getApiKeyTypeProps(apiKey.type, t)

  return (
    <Container className="divide-y p-0" data-testid={`${apiKey.type}-api-key-general-section`}>
      <div className="flex items-center justify-between px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-header`}>
        <Heading data-testid={`${apiKey.type}-api-key-general-section-heading`}>{apiKey.title}</Heading>
        <div className="flex items-center gap-x-4" data-testid={`${apiKey.type}-api-key-general-section-actions`}>
          <div className="flex items-center gap-x-2" data-testid={`${apiKey.type}-api-key-general-section-status`}>
            <StatusBadge color={apiKeyStatus.color} data-testid={`${apiKey.type}-api-key-general-section-status-badge`}>
              {apiKeyStatus.label}
            </StatusBadge>
          </div>
          <ActionMenu
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
                actions: dangerousActions,
              },
            ]}
            data-testid={`${apiKey.type}-api-key-general-section-action-menu`}
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-key-row`}>
        <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-key-label`}>
          {t("fields.key")}
        </Text>
        {apiKey.type === "secret" ? (
          <Badge size="2xsmall" className="inline-block w-fit" data-testid={`${apiKey.type}-api-key-general-section-key-badge`}>
            {prettifyRedactedToken(apiKey.redacted)}
          </Badge>
        ) : (
          <Copy asChild content={apiKey.token} className="cursor-pointer" data-testid={`${apiKey.type}-api-key-general-section-key-copy`}>
            <Badge size="2xsmall" className="text-ui-tag-neutral-text" data-testid={`${apiKey.type}-api-key-general-section-key-badge`}>
              {prettifyRedactedToken(apiKey.redacted)}
            </Badge>
          </Copy>
        )}
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-type-row`}>
        <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-type-label`}>
          {t("fields.type")}
        </Text>
        <Text size="small" leading="compact" data-testid={`${apiKey.type}-api-key-general-section-type-value`}>
          {apiKeyType.label}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-last-used-row`}>
        <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-last-used-label`}>
          {t("apiKeyManagement.fields.lastUsedAtLabel")}
        </Text>
        <Text size="small" leading="compact" data-testid={`${apiKey.type}-api-key-general-section-last-used-value`}>
          {apiKey.last_used_at
            ? getFullDate({ date: apiKey.last_used_at, includeTime: true })
            : "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-created-by-row`}>
        <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-created-by-label`}>
          {t("apiKeyManagement.fields.createdByLabel")}
        </Text>
        <ActionBy userId={apiKey.created_by} data-testid={`${apiKey.type}-api-key-general-section-created-by-value`} />
      </div>
      {apiKey.revoked_at && (
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-revoked-at-row`}>
            <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-revoked-at-label`}>
              {t("apiKeyManagement.fields.revokedAtLabel")}
            </Text>
            <Text size="small" leading="compact" data-testid={`${apiKey.type}-api-key-general-section-revoked-at-value`}>
              {getFullDate({ date: apiKey.revoked_at, includeTime: true })}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid={`${apiKey.type}-api-key-general-section-revoked-by-row`}>
            <Text size="small" leading="compact" weight="plus" data-testid={`${apiKey.type}-api-key-general-section-revoked-by-label`}>
              {t("apiKeyManagement.fields.revokedByLabel")}
            </Text>
            <ActionBy userId={apiKey.revoked_by} data-testid={`${apiKey.type}-api-key-general-section-revoked-by-value`} />
          </div>
        </>
      )}
    </Container>
  )
}

const ActionBy = ({ userId, "data-testid": dataTestId }: { userId: string | null; "data-testid"?: string }) => {
  const { user, isLoading, isError, error } = useUser(userId!, undefined, {
    enabled: !!userId,
  })

  if (!userId) {
    return (
      <Text size="small" className="text-ui-fg-subtle" data-testid={dataTestId}>
        -
      </Text>
    )
  }

  if (isError) {
    throw error
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-[20px_1fr]" data-testid={dataTestId}>
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="w-full max-w-[220px]" />
      </div>
    )
  }

  if (!user) {
    return (
      <Text size="small" className="text-ui-fg-subtle" data-testid={dataTestId}>
        -
      </Text>
    )
  }

  return <UserLink {...user} data-testid={dataTestId} />
}
