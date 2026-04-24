import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Select, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { languages } from "../../../../../../i18n/languages"
import { useDocumentDirection } from "../../../../../../hooks/use-document-direction"
import { useMe, useUpdateMe } from "../../../../../../hooks/api"

const EditProfileSchema = zod.object({
  first_name: zod.string().optional().or(zod.literal("")),
  last_name: zod.string().optional().or(zod.literal("")),
  language: zod.string(),
})

export const EditProfileForm = () => {
  const { t, i18n } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()

  const { seller_member } = useMe()
  const member = seller_member?.member

  const form = useForm<zod.infer<typeof EditProfileSchema>>({
    defaultValues: {
      first_name: member?.first_name ?? "",
      last_name: member?.last_name ?? "",
      language: i18n.language,
    },
    resolver: zodResolver(EditProfileSchema),
  })

  const sortedLanguages = languages.sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  )

  const { mutateAsync: updateMe, isPending } = useUpdateMe()

  const handleSubmit = form.handleSubmit(async (values) => {
    await updateMe(
      {
        first_name: values.first_name || null,
        last_name: values.last_name || null,
      },
      {
        onSuccess: async () => {
          await i18n.changeLanguage(values.language)
          toast.success(t("profile.toast.edit"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-8">
            <div className="grid grid-cols-2 gap-x-3">
              <Form.Field
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("profile.fields.firstName", "First name")}
                    </Form.Label>
                    <Form.Control>
                      <Input autoComplete="given-name" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("profile.fields.lastName", "Last name")}
                    </Form.Label>
                    <Form.Control>
                      <Input autoComplete="family-name" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
            <Form.Field
              control={form.control}
              name="language"
              render={({ field: { ref, ...field } }) => (
                <Form.Item className="gap-y-4">
                  <div>
                    <Form.Label>{t("profile.fields.languageLabel")}</Form.Label>
                    <Form.Hint>{t("profile.edit.languageHint")}</Form.Hint>
                  </div>
                  <div>
                    <Form.Control>
                      <Select
                        dir={direction}
                        {...field}
                        onValueChange={field.onChange}
                      >
                        <Select.Trigger ref={ref} className="py-1 text-[13px]">
                          <Select.Value
                            placeholder={t("profile.edit.languagePlaceholder")}
                          >
                            {
                              sortedLanguages.find(
                                (language) => language.code === field.value
                              )?.display_name
                            }
                          </Select.Value>
                        </Select.Trigger>
                        <Select.Content>
                          {sortedLanguages.map((language) => (
                            <Select.Item
                              key={language.code}
                              value={language.code}
                            >
                              {language.display_name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </div>
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
