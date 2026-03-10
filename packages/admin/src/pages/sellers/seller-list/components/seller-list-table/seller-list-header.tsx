import { ReactNode, Children, useState } from "react"
import { Button, Drawer, Heading, Input, Label, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useInviteSeller } from "../../../../../hooks/api/sellers"

export const SellerListTitle = () => {
  return (
    <div>
      <Heading level="h2">Sellers</Heading>
    </div>
  )
}

export const SellerListActions = ({
  children,
}: {
  children?: ReactNode
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const { mutateAsync, isPending } = useInviteSeller({
    onSuccess: (_data, variables) => {
      toast.success(
        t("sellers.invite.successToast", { email: variables.email })
      )
      setEmail("")
      setError("")
      setOpen(false)
    },
    onError: () => {
      toast.error(t("sellers.invite.errorToast"))
    },
  })

  const handleSubmit = async () => {
    const result = z.string().email().safeParse(email)
    if (!result.success) {
      setError(t("sellers.fields.email"))
      return
    }
    setError("")
    await mutateAsync({ email })
  }

  return (
    <div className="flex items-center justify-center gap-x-2">
      {children}
      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Trigger asChild>
          <Button variant="secondary" size="small">
            {t("sellers.invite.button")}
          </Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{t("sellers.invite.header")}</Drawer.Title>
            <Drawer.Description>
              {t("sellers.invite.hint")}
            </Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="invite-email">{t("sellers.fields.email")}</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError("")
                }}
                placeholder="vendor@example.com"
              />
              {error && (
                <span className="text-ui-fg-error txt-small">{error}</span>
              )}
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">{t("actions.cancel")}</Button>
            </Drawer.Close>
            <Button
              onClick={handleSubmit}
              isLoading={isPending}
              disabled={!email}
            >
              {t("actions.send")}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const SellerListHeader = ({
  children,
}: {
  children?: ReactNode
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SellerListTitle />
          <SellerListActions />
        </>
      )}
    </div>
  )
}
