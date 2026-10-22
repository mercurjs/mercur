import { useMemo } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Text, Textarea, toast } from "@medusajs/ui"
import type { RouteHandle } from "@mercurjs/dashboard-sdk"
import { Form, KeyboundForm, RouteDrawer, SectionRow, useRouteModal } from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import * as zod from "zod"

import { useSignSpraayBatch, useSpraayBatch, type SpraayBatch } from "../../../../lib/spraay/api"
import { formatUsdc, shortHex } from "../../../../lib/spraay/format"

export const handle: RouteHandle = {
  permissions: "spraay.sign:edit",
}

const createSignBatchSchema = (invalidMessage: string) =>
  zod.object({
    signed_transaction: zod.string().trim().regex(/^0x[0-9a-fA-F]+$/, invalidMessage),
  })

type SignBatchValues = zod.infer<ReturnType<typeof createSignBatchSchema>>

const SignBatchForm = ({ batch }: { batch: SpraayBatch }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const schema = useMemo(() => createSignBatchSchema(t("spraay.sign.invalidHex")), [t])
  const form = useForm<SignBatchValues>({
    defaultValues: { signed_transaction: "" },
    resolver: zodResolver(schema),
  })

  const { mutateAsync, isPending } = useSignSpraayBatch(batch.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ tx_hash }) => {
        toast.success(t("spraay.sign.successToast", { hash: shortHex(tx_hash) }))
        handleSuccess()
      },
      onError: (error) => {
        form.setError("signed_transaction", { type: "manual", message: error.message })
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="spraay-sign-form">
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body className="flex flex-col gap-y-6">
          <div className="shadow-elevation-card-rest bg-ui-bg-component divide-y rounded-lg">
            <SectionRow title={t("spraay.fields.treasury")} value={shortHex(batch.treasury_address)} />
            <SectionRow title={t("spraay.transaction.to")} value={shortHex(batch.unsigned_tx_to)} />
            <SectionRow title={t("spraay.transaction.nonce")} value={String(batch.unsigned_tx_nonce ?? "-")} />
            <SectionRow title={t("spraay.fields.recipients")} value={String(batch.recipient_count)} />
            <SectionRow title={t("spraay.fields.total")} value={formatUsdc(batch.total_amount)} />
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            {t("spraay.sign.hint")}
          </Text>
          <Form.Field
            control={form.control}
            name="signed_transaction"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("spraay.sign.label")}</Form.Label>
                <Form.Control>
                  <Textarea
                    {...field}
                    rows={8}
                    className="font-mono"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="0x02f9…"
                    data-testid="spraay-sign-input"
                  />
                </Form.Control>
                <Form.ErrorMessage data-testid="spraay-sign-error" />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="spraay-sign-cancel">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="spraay-sign-submit">
              {t("spraay.sign.submit")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

const SpraaySignBatchDrawer = () => {
  const { t } = useTranslation()
  const { batchId } = useParams()
  const { batch, isPending, isError, error } = useSpraayBatch(batchId!)

  if (isError) {
    throw error
  }

  const ready = !isPending && !!batch && batch.status === "awaiting_signature"

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("spraay.sign.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">{t("spraay.sign.description")}</RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <SignBatchForm batch={batch} />}
      {!isPending && batch && batch.status !== "awaiting_signature" && (
        <RouteDrawer.Body>
          <Text size="small" className="text-ui-fg-subtle" data-testid="spraay-sign-unavailable">
            {t("spraay.sign.unavailable")}
          </Text>
        </RouteDrawer.Body>
      )}
    </RouteDrawer>
  )
}

export default SpraaySignBatchDrawer
