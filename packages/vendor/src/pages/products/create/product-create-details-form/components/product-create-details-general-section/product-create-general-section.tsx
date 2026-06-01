import { Input, Text, Textarea } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { Form } from "@components/common/form"
import { HandleInput } from "@components/inputs/handle-input"
import { useTabbedForm } from "@components/tabbed-form"
import { ProductCreateSchemaType } from "../../../types"

export const ProductCreateGeneralSection = () => {
  const { t } = useTranslation()
  const form = useTabbedForm<ProductCreateSchemaType>()

  return (
    <div id="general" className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("products.fields.title.label")}</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder={t("products.fields.title.placeholder")}
                    />
                  </Form.Control>
                  <Form.ErrorMessage>{form.formState.errors.title?.message}</Form.ErrorMessage>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="subtitle"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label optional>
                    {t("products.fields.subtitle.label")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder={t("products.fields.subtitle.placeholder")}
                    />
                  </Form.Control>
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={t("products.fields.handle.tooltip")}
                    optional
                  >
                    {t("fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput
                      {...field}
                      placeholder={t("products.fields.handle.placeholder")}
                    />
                  </Form.Control>
                  <Form.ErrorMessage>{form.formState.errors.handle?.message}</Form.ErrorMessage>
                </Form.Item>
              )
            }}
          />
        </div>
      </div>
      <Form.Field
        control={form.control}
        name="description"
        render={({ field }) => {
          return (
            <Form.Item>
              <Form.Label optional>
                {t("products.fields.description.label")}
              </Form.Label>
              <Form.Control>
                <Textarea
                  {...field}
                  placeholder={t("products.fields.description.placeholder")}
                />
              </Form.Control>
            </Form.Item>
          )
        }}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Text size="small" className="text-ui-fg-subtle">
            开发者中心只填写已有岗位包的公开上架资料；开发者模式是主系统同一聊天框内的工作阶段，业务逻辑由主系统处理，不在云端 metadata 保存 modeStage、提示词、聊天记录或私有 workspace 上下文。
          </Text>
        </div>
        <Form.Field
          control={form.control}
          name="role_package_id"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>岗位包 ID</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="pkg_customer_quality" />
                </Form.Control>
                <Form.ErrorMessage>
                  {form.formState.errors.role_package_id?.message}
                </Form.ErrorMessage>
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="role_package_version"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>岗位包版本</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder="0.1.0" />
                </Form.Control>
                <Form.ErrorMessage>
                  {form.formState.errors.role_package_version?.message}
                </Form.ErrorMessage>
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="role_authorization_fee_yuan"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>一次授权费（元）</Form.Label>
                <Form.Control>
                  <Input {...field} inputMode="decimal" placeholder="299.00" />
                </Form.Control>
                <Form.ErrorMessage>
                  {form.formState.errors.role_authorization_fee_yuan?.message}
                </Form.ErrorMessage>
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="role_input_token_price_cents_per_million"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>输入 Token 单价（分/百万）</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                  />
                </Form.Control>
                <Form.ErrorMessage>
                  {form.formState.errors.role_input_token_price_cents_per_million?.message}
                </Form.ErrorMessage>
              </Form.Item>
            )
          }}
        />
        <Form.Field
          control={form.control}
          name="role_output_token_price_cents_per_million"
          render={({ field }) => {
            return (
              <Form.Item>
                <Form.Label>输出 Token 单价（分/百万）</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="0"
                  />
                </Form.Control>
                <Form.ErrorMessage>
                  {form.formState.errors.role_output_token_price_cents_per_million?.message}
                </Form.ErrorMessage>
              </Form.Item>
            )
          }}
        />
      </div>
      <Form.Field
        control={form.control}
        name="role_manifest_ref"
        render={({ field }) => {
          return (
            <Form.Item>
              <Form.Label optional>岗位包清单</Form.Label>
              <Form.Control>
                <Input {...field} placeholder="role_package/manifest.json" />
              </Form.Control>
              <Form.ErrorMessage>
                {form.formState.errors.role_manifest_ref?.message}
              </Form.ErrorMessage>
            </Form.Item>
          )
        }}
      />
      <Form.Field
        control={form.control}
        name="role_capabilities"
        render={({ field }) => {
          return (
            <Form.Item>
              <Form.Label optional>岗位能力</Form.Label>
              <Form.Control>
                <Textarea {...field} placeholder="资料处理, 自动化执行" />
              </Form.Control>
            </Form.Item>
          )
        }}
      />
    </div>
  )
}
