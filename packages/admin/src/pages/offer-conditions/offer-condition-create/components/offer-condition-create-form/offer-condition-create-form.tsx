import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import {
  Form,
  KeyboundForm,
  RouteFocusModal,
  useRouteModal,
} from "@mercurjs/dashboard-shared"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { SwitchBox } from "../../../../../components/common/switch-box"
import { useCreateOfferCondition } from "../../../../../hooks/api"

const OfferConditionCreateSchema = z.object({
  label: z.string().min(1),
  code: z.string().min(1),
  rank: z.number().int().min(0).optional(),
  is_active: z.boolean(),
})

const generateCodeFromLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")

export const OfferConditionCreateForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof OfferConditionCreateSchema>>({
    defaultValues: {
      label: "",
      code: "",
      rank: 0,
      is_active: true,
    },
    resolver: zodResolver(OfferConditionCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateOfferCondition()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ offer_condition }) => {
        toast.success(
          t("offerConditions.create.successToast", {
            label: offer_condition.label,
          })
        )
        handleSuccess("../")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="offer-condition-create-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header data-testid="offer-condition-create-form-header" />
        <RouteFocusModal.Body
          className="flex flex-1 justify-center overflow-auto px-6 py-16"
          data-testid="offer-condition-create-form-body"
        >
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-1">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="offer-condition-create-form-heading">
                  {t("offerConditions.create.header")}
                </Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                  data-testid="offer-condition-create-form-subtitle"
                >
                  {t("offerConditions.create.subtitle")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="label"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>
                        {t("offerConditions.fields.label.label")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t(
                            "offerConditions.fields.label.placeholder"
                          )}
                          data-testid="offer-condition-create-form-label-input"
                          onChange={(e) => {
                            if (
                              !form.getFieldState("code").isTouched ||
                              !form.getValues("code")
                            ) {
                              form.setValue(
                                "code",
                                generateCodeFromLabel(e.target.value)
                              )
                            }
                            field.onChange(e)
                          }}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label
                        tooltip={t("offerConditions.fields.code.tooltip")}
                      >
                        {t("offerConditions.fields.code.label")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          placeholder={t(
                            "offerConditions.fields.code.placeholder"
                          )}
                          data-testid="offer-condition-create-form-code-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="rank"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label
                        optional
                        tooltip={t("offerConditions.fields.rank.tooltip")}
                      >
                        {t("offerConditions.fields.rank.label")}
                      </Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value)
                            )
                          }
                          data-testid="offer-condition-create-form-rank-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="is_active"
              label={t("offerConditions.fields.isActive.label")}
              description={t("offerConditions.fields.isActive.hint")}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="offer-condition-create-form-footer">
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button
                size="small"
                variant="secondary"
                type="button"
                data-testid="offer-condition-create-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="offer-condition-create-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
