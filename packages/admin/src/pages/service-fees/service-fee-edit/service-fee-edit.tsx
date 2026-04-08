import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import {
  useServiceFee,
  useUpdateServiceFee,
} from "../../../hooks/api/service-fees"

type EditServiceFeeFormData = {
  name: string
  display_name: string
  value: number
  custom_period: boolean
  start_date?: string
  end_date?: string
}

export const ServiceFeeEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { service_fee, isLoading } = useServiceFee(id!)
  const updateMutation = useUpdateServiceFee(id!)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditServiceFeeFormData>()

  useEffect(() => {
    if (service_fee) {
      reset({
        name: service_fee.name,
        display_name: service_fee.display_name,
        value: service_fee.value,
        custom_period: !!(service_fee.start_date || service_fee.end_date),
        start_date: service_fee.start_date
          ? new Date(service_fee.start_date).toISOString().split("T")[0]
          : "",
        end_date: service_fee.end_date
          ? new Date(service_fee.end_date).toISOString().split("T")[0]
          : "",
      })
    }
  }, [service_fee, reset])

  const customPeriod = watch("custom_period")

  const onSubmit = async (data: EditServiceFeeFormData) => {
    try {
      const payload: any = {
        name: data.name,
        display_name: data.display_name,
        value: Number(data.value),
      }

      if (data.custom_period && data.start_date) {
        payload.start_date = new Date(data.start_date).toISOString()
        if (data.end_date) {
          payload.end_date = new Date(data.end_date).toISOString()
        }
      }

      await updateMutation.mutateAsync(payload)
      toast.success("Service fee updated")
      navigate(`/settings/service-fees/${id}`)
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ui-bg-switch-off rounded w-1/3" />
          <div className="h-60 bg-ui-bg-switch-off rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="mb-4">
        <Button
          variant="transparent"
          onClick={() => navigate(`/settings/service-fees/${id}`)}
        >
          &larr; Back to Service Fees
        </Button>
      </div>

      <Heading level="h1" className="mb-1">
        Edit Service Fee
      </Heading>
      <Text className="text-ui-fg-subtle mb-6">
        Update service fee configuration
      </Text>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-[1fr_300px] gap-6">
          <div className="space-y-6">
            <Container>
              <Heading level="h2" className="mb-4">
                Basic Information
              </Heading>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Fee Name *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Name is required" })}
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name to Seller *</Label>
                  <Input
                    id="display_name"
                    {...register("display_name", {
                      required: "Display name is required",
                    })}
                  />
                </div>
                <div>
                  <Label>Charging Level</Label>
                  <Input
                    value={
                      service_fee?.charging_level
                        ? service_fee.charging_level.charAt(0).toUpperCase() +
                          service_fee.charging_level.slice(1) +
                          " Level"
                        : ""
                    }
                    disabled
                  />
                  <Text className="text-ui-fg-subtle text-xs mt-1">
                    Charging level cannot be changed after creation
                  </Text>
                </div>
                <div>
                  <Label htmlFor="value">Service Fee Rate (%) *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
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

            <Container>
              <Heading level="h2" className="mb-4">
                Period
              </Heading>
              <div
                className="flex items-center gap-3 cursor-pointer mb-4"
                onClick={() => {
                  const current = watch("custom_period")
                  // Toggle custom_period via setValue equivalent
                  reset({ ...watch(), custom_period: !current }, { keepDirty: true })
                }}
              >
                <div
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer flex items-center ${
                    customPeriod ? "bg-ui-bg-interactive justify-end" : "bg-ui-bg-switch-off justify-start"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5" />
                </div>
                <Text className="font-medium">Set Custom Period</Text>
              </div>
              {customPeriod ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...register("start_date")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...register("end_date")}
                    />
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
            </Container>
          </div>

          {/* Actions Sidebar */}
          <div>
            <Container className="sticky top-4">
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(`/settings/service-fees/${id}`)}
                  type="button"
                >
                  Cancel
                </Button>
              </div>
              <div className="mt-4 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
                <Text className="text-ui-fg-subtle text-xs">
                  Note: Changes will take effect immediately for future
                  transactions.
                </Text>
              </div>
            </Container>
          </div>
        </div>
      </form>
    </div>
  )
}
