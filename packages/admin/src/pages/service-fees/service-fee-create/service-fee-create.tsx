import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  RadioGroup,
  Text,
  Checkbox,
  Select,
  toast,
} from "@medusajs/ui"
import { useCreateServiceFee } from "../../../hooks/api/service-fees"

type CreateServiceFeeFormData = {
  name: string
  display_name: string
  charging_level: "item" | "shop"
  value: number
  code: string
  custom_period: boolean
  start_date?: string
  end_date?: string
  eligibility_type?: "categories" | "product_group"
  application_mode?: "include" | "exclude"
  categories?: string[]
  apply_to_shops?: boolean
  shop_selection_method?: "all" | "upload_ids" | "shop_groups"
}

export const ServiceFeeCreatePage = () => {
  const navigate = useNavigate()
  const createMutation = useCreateServiceFee()

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFeeFormData>({
    defaultValues: {
      charging_level: "item",
      custom_period: false,
      eligibility_type: "categories",
      application_mode: "include",
      categories: [],
      apply_to_shops: false,
      shop_selection_method: "all",
    },
  })

  const chargingLevel = watch("charging_level")
  const customPeriod = watch("custom_period")
  const applyToShops = watch("apply_to_shops")

  const onSubmit = async (data: CreateServiceFeeFormData) => {
    try {
      const payload: any = {
        name: data.name,
        display_name: data.display_name,
        code: data.code || data.name.toLowerCase().replace(/\s+/g, "_"),
        type: "percentage",
        charging_level: data.charging_level,
        value: Number(data.value),
        status: "active",
      }

      if (data.categories && data.categories.length > 0) {
        payload.rules = data.categories.map((catId: string) => ({
          reference: "product_category",
          reference_id: catId,
          mode: data.application_mode || "include",
        }))
      }

      if (data.custom_period && data.start_date) {
        payload.start_date = new Date(data.start_date).toISOString()
        payload.effective_date = new Date(data.start_date).toISOString()
        payload.status = new Date(data.start_date) > new Date() ? "pending" : "active"
        if (data.end_date) {
          payload.end_date = new Date(data.end_date).toISOString()
        }
      }

      await createMutation.mutateAsync(payload)
      toast.success("Service fee created")
      navigate("/settings/service-fees")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create service fee")
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="mb-4">
        <Button variant="transparent" onClick={() => navigate("/settings/service-fees")}>
          &larr; Back to Service Fees
        </Button>
      </div>

      <Heading level="h1" className="mb-1">
        Create New Service Fee
      </Heading>
      <Text className="text-ui-fg-subtle mb-6">
        Set up a new service fee for your marketplace
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <Container>
              <Heading level="h2" className="mb-4">
                Basic Information
              </Heading>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Fee Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Payment Processing Fee"
                    {...register("name", { required: "Fee name is required" })}
                  />
                  <Text className="text-ui-fg-subtle text-xs mt-1">
                    Internal name for this service fee
                  </Text>
                  {errors.name && (
                    <Text className="text-ui-fg-error text-xs">
                      {errors.name.message}
                    </Text>
                  )}
                </div>

                <div>
                  <Label htmlFor="display_name">Display Name to Seller *</Label>
                  <Input
                    id="display_name"
                    placeholder="e.g., Payment Gateway Fee"
                    {...register("display_name", {
                      required: "Display name is required",
                    })}
                  />
                  <Text className="text-ui-fg-subtle text-xs mt-1">
                    This name will be shown to sellers in their dashboard
                  </Text>
                </div>

                <div>
                  <Label>Charging Level *</Label>
                  <Controller
                    name="charging_level"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              field.value === "item"
                                ? "border-ui-border-interactive bg-ui-bg-interactive"
                                : "border-ui-border-base"
                            }`}
                            onClick={() => field.onChange("item")}
                          >
                            <RadioGroup.Item value="item" className="hidden" />
                            <Text
                              className={
                                field.value === "item"
                                  ? "text-ui-fg-on-color font-medium"
                                  : ""
                              }
                            >
                              Item Level
                            </Text>
                          </div>
                          <div
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              field.value === "shop"
                                ? "border-ui-border-interactive bg-ui-bg-interactive"
                                : "border-ui-border-base"
                            }`}
                            onClick={() => field.onChange("shop")}
                          >
                            <RadioGroup.Item value="shop" className="hidden" />
                            <Text
                              className={
                                field.value === "shop"
                                  ? "text-ui-fg-on-color font-medium"
                                  : ""
                              }
                            >
                              Shop Level
                            </Text>
                          </div>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="value">Service Fee Rate (%) *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("value", {
                      required: "Rate is required",
                      min: { value: 0.01, message: "Must be > 0" },
                      max: { value: 100, message: "Cannot exceed 100%" },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.value && (
                    <Text className="text-ui-fg-error text-xs">
                      {errors.value.message}
                    </Text>
                  )}
                </div>
              </div>
            </Container>

            {/* Period */}
            <Container>
              <Heading level="h2" className="mb-4">
                Period
              </Heading>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("custom_period")}
                    className="rounded border-ui-border-base"
                  />
                  <div>
                    <Text className="font-medium">Set Custom Period</Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      Define a specific date range for this fee
                    </Text>
                  </div>
                </label>

                {customPeriod ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        {...register("start_date", {
                          required: customPeriod
                            ? "Start date required"
                            : false,
                        })}
                      />
                      <Text className="text-ui-fg-subtle text-xs mt-1">
                        Must be a future date
                      </Text>
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        {...register("end_date")}
                      />
                      <Text className="text-ui-fg-subtle text-xs mt-1">
                        Leave empty for indefinite period
                      </Text>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-3">
                    <Text className="text-ui-fg-subtle text-sm">
                      This fee has no custom period and will remain active
                      indefinitely.
                    </Text>
                  </div>
                )}
              </div>
            </Container>

            {/* Item Eligibility (Item Level only) */}
            {chargingLevel === "item" && (
              <Container>
                <Heading level="h2" className="mb-4">
                  Item Eligibility
                </Heading>
                <div className="space-y-4">
                  <div>
                    <Label>Eligibility Type</Label>
                    <Controller
                      name="eligibility_type"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["categories", "product_group"].map((opt) => (
                            <div
                              key={opt}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                field.value === opt
                                  ? "border-ui-border-interactive bg-ui-bg-interactive"
                                  : "border-ui-border-base"
                              }`}
                              onClick={() => field.onChange(opt)}
                            >
                              <Text
                                className={
                                  field.value === opt
                                    ? "text-ui-fg-on-color font-medium"
                                    : ""
                                }
                              >
                                {opt === "categories"
                                  ? "Categories"
                                  : "Product Group"}
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Application Mode</Label>
                    <Controller
                      name="application_mode"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {["include", "exclude"].map((opt) => (
                            <div
                              key={opt}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                field.value === opt
                                  ? "border-ui-border-interactive bg-ui-bg-interactive"
                                  : "border-ui-border-base"
                              }`}
                              onClick={() => field.onChange(opt)}
                            >
                              <Text
                                className={
                                  field.value === opt
                                    ? "text-ui-fg-on-color font-medium"
                                    : ""
                                }
                              >
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </Text>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                    <Text className="text-ui-fg-subtle text-xs mt-1">
                      {watch("application_mode") === "include"
                        ? "Service fee will apply to selected categories only"
                        : "Service fee will apply to all categories except selected"}
                    </Text>
                  </div>

                  <div>
                    <Label>Select Categories</Label>
                    <Controller
                      name="categories"
                      control={control}
                      render={({ field }) => {
                        const values = field.value || []
                        return (
                          <div className="space-y-2">
                            {values.map((cat: string, idx: number) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <Select
                                  value={cat}
                                  onValueChange={(val) => {
                                    const updated = [...values]
                                    updated[idx] = val
                                    field.onChange(updated)
                                  }}
                                >
                                  <Select.Trigger className="flex-1">
                                    <Select.Value placeholder="Select category" />
                                  </Select.Trigger>
                                  <Select.Content>
                                    <Select.Item value="electronics">Electronics</Select.Item>
                                    <Select.Item value="mobile">Mobile &amp; Gadgets</Select.Item>
                                    <Select.Item value="fashion">Fashion</Select.Item>
                                    <Select.Item value="home">Home &amp; Living</Select.Item>
                                  </Select.Content>
                                </Select>
                                <Button
                                  variant="transparent"
                                  type="button"
                                  onClick={() => {
                                    const updated = values.filter((_: string, i: number) => i !== idx)
                                    field.onChange(updated)
                                  }}
                                  className="text-ui-fg-error"
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="transparent"
                              type="button"
                              onClick={() => field.onChange([...values, ""])}
                              className="text-ui-fg-interactive"
                            >
                              + Add Another Category
                            </Button>
                          </div>
                        )
                      }}
                    />
                  </div>
                </div>
              </Container>
            )}

            {/* Shop Selection (Shop Level) */}
            {chargingLevel === "shop" && (
              <Container>
                <Heading level="h2" className="mb-4">
                  Shop Selection
                </Heading>
                <Controller
                  name="shop_selection_method"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "all", label: "All Shops" },
                        { value: "upload_ids", label: "Upload Shop IDs" },
                        { value: "shop_groups", label: "Shop Groups" },
                      ].map((opt) => (
                        <div
                          key={opt.value}
                          className={`border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                            field.value === opt.value
                              ? "border-ui-border-interactive bg-ui-bg-interactive"
                              : "border-ui-border-base"
                          }`}
                          onClick={() => field.onChange(opt.value)}
                        >
                          <Text
                            className={
                              field.value === opt.value
                                ? "text-ui-fg-on-color font-medium"
                                : ""
                            }
                          >
                            {opt.label}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                />
                <Text className="text-ui-fg-subtle text-sm mt-2">
                  {watch("shop_selection_method") === "all"
                    ? "This service fee will apply to all shops in the marketplace."
                    : "Select specific shops or shop groups for this fee."}
                </Text>
              </Container>
            )}
          </div>

          {/* Actions Sidebar */}
          <div>
            <Container className="sticky top-4">
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || createMutation.isPending}
                  isLoading={createMutation.isPending}
                >
                  Create Service Fee
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/settings/service-fees")}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
              <div className="mt-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                <Text className="text-ui-fg-subtle text-xs">
                  Note: Service fees are stackable and can be combined with other
                  active fees.
                </Text>
              </div>
            </Container>
          </div>
        </div>
      </form>
    </div>
  )
}
