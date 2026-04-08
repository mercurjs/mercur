import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  Drawer,
  Button,
  Input,
  Label,
  Text,
  Heading,
  Prompt,
  toast,
} from "@medusajs/ui"
import {
  useUpdateServiceFee,
  useDeactivateServiceFee,
} from "../../../../hooks/api/service-fees"

type EditGlobalFeeFormData = {
  name: string
  display_name: string
  value: number
  effective_date: string
}

type Props = {
  fee: any
  open: boolean
  onClose: () => void
}

export const EditGlobalFeeDrawer = ({ fee, open, onClose }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditGlobalFeeFormData>({
    defaultValues: {
      name: fee?.name ?? "",
      display_name: fee?.display_name ?? "",
      value: fee?.value ?? 0,
      effective_date: fee?.effective_date
        ? new Date(fee.effective_date).toISOString().split("T")[0]
        : "",
    },
  })

  useEffect(() => {
    if (fee) {
      reset({
        name: fee.name,
        display_name: fee.display_name,
        value: fee.value,
        effective_date: fee.effective_date
          ? new Date(fee.effective_date).toISOString().split("T")[0]
          : "",
      })
    }
  }, [fee, reset])

  const updateMutation = useUpdateServiceFee(fee?.id)
  const deactivateMutation = useDeactivateServiceFee(fee?.id)

  const onSubmit = async (data: EditGlobalFeeFormData) => {
    try {
      await updateMutation.mutateAsync({
        name: data.name,
        display_name: data.display_name,
        value: Number(data.value),
        effective_date: data.effective_date
          ? new Date(data.effective_date).toISOString()
          : undefined,
      })
      toast.success("Global service fee updated")
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update")
    }
  }

  const [showDeactivatePrompt, setShowDeactivatePrompt] = useState(false)

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync()
      toast.success("Global fee deactivated")
      setShowDeactivatePrompt(false)
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to deactivate")
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Heading>Edit Global Service Fee</Heading>
        </Drawer.Header>
        <Drawer.Body className="space-y-4">
          <form
            id="edit-global-fee-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Fee Name *</Label>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <Text className="text-ui-fg-error text-xs mt-1">
                  {errors.name.message}
                </Text>
              )}
            </div>

            <div>
              <Label htmlFor="display_name">Display Name to Seller *</Label>
              <Input
                id="display_name"
                {...register("display_name", {
                  required: "Display name is required",
                })}
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                This name will be displayed to sellers in the seller center
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
                  min: { value: 0.01, message: "Must be greater than 0" },
                  max: { value: 100, message: "Cannot exceed 100%" },
                  valueAsNumber: true,
                })}
              />
              {errors.value && (
                <Text className="text-ui-fg-error text-xs mt-1">
                  {errors.value.message}
                </Text>
              )}
            </div>

            <div>
              <Label htmlFor="effective_date">Effective Date *</Label>
              <Input
                id="effective_date"
                type="date"
                {...register("effective_date", {
                  required: "Effective date is required",
                })}
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                If set to a future date, the current global fee remains active
                until then.
              </Text>
            </div>

            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
              <Text className="font-medium text-sm">Important</Text>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Editing the global fee will create a new fee rule and deactivate
                the current one. The change will be effective on the selected
                date.
              </Text>
            </div>
          </form>
        </Drawer.Body>
        <Drawer.Footer>
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              onClick={() => setShowDeactivatePrompt(true)}
              disabled={deactivateMutation.isPending}
            >
              Deactivate Fee
            </Button>
            <Prompt open={showDeactivatePrompt} onOpenChange={setShowDeactivatePrompt}>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Deactivate Global Fee</Prompt.Title>
                  <Prompt.Description>
                    Are you sure you want to deactivate this global fee? Orders will not have a global fee applied until a new one is activated.
                  </Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Cancel</Prompt.Cancel>
                  <Prompt.Action onClick={handleDeactivate}>
                    Deactivate
                  </Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-global-fee-form"
                disabled={isSubmitting || updateMutation.isPending}
                isLoading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
