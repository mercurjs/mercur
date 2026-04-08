import { useNavigate, useParams } from "react-router-dom"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  toast,
} from "@medusajs/ui"
import { PencilSquare } from "@medusajs/icons"
import {
  useServiceFee,
  useServiceFeeChangeLogs,
  useDeactivateServiceFee,
} from "../../../hooks/api/service-fees"

const statusColorMap: Record<string, string> = {
  active: "green",
  pending: "blue",
  inactive: "grey",
}

export const ServiceFeeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { service_fee, isLoading } = useServiceFee(id!)
  const { change_logs } = useServiceFeeChangeLogs(id!)
  const deactivateMutation = useDeactivateServiceFee(id!)

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this fee?")) return
    try {
      await deactivateMutation.mutateAsync()
      toast.success("Fee deactivated")
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to deactivate")
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ui-bg-switch-off rounded w-1/3" />
          <div className="h-40 bg-ui-bg-switch-off rounded" />
        </div>
      </div>
    )
  }

  if (!service_fee) {
    return (
      <div className="max-w-[1200px] mx-auto py-8 px-4">
        <Text>Service fee not found</Text>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4">
      <div className="mb-4">
        <Button variant="transparent" onClick={() => navigate("/settings/service-fees")}>
          &larr; Back to Service Fees
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heading level="h1">{service_fee.name}</Heading>
          <Badge
            color={statusColorMap[service_fee.status] as any ?? "grey"}
            size="small"
          >
            {service_fee.status?.charAt(0).toUpperCase() +
              service_fee.status?.slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" onClick={handleDeactivate}>
            Deactivate
          </Button>
          <Button onClick={() => navigate(`/settings/service-fees/${id}/edit`)}>
            <PencilSquare />
            Edit Fee
          </Button>
        </div>
      </div>

      <Text className="text-ui-fg-subtle mb-6">
        Fee ID: #{service_fee.id}
      </Text>

      <div className="grid grid-cols-[1fr_350px] gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Container>
            <Heading level="h2" className="mb-4">
              Basic Information
            </Heading>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text className="text-ui-fg-subtle text-xs">Fee Name</Text>
                <Text className="font-medium">{service_fee.name}</Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Display Name to Seller
                </Text>
                <Text className="font-medium">{service_fee.display_name}</Text>
                <Text className="text-ui-fg-subtle text-xs">
                  Shown in seller center
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Charging Level
                </Text>
                <Text className="font-medium capitalize">
                  {service_fee.charging_level}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">
                  Service Fee Rate
                </Text>
                <Text className="font-medium text-ui-fg-interactive">
                  {service_fee.value}%
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">Created Date</Text>
                <Text className="font-medium">
                  {new Date(service_fee.created_at).toLocaleDateString()}
                </Text>
              </div>
            </div>
          </Container>

          {/* Period */}
          <Container>
            <Heading level="h2" className="mb-4">
              Period
            </Heading>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text className="text-ui-fg-subtle text-xs">Start Date</Text>
                <Text className="font-medium">
                  {service_fee.start_date
                    ? new Date(service_fee.start_date).toLocaleDateString()
                    : "Not Set"}
                </Text>
              </div>
              <div>
                <Text className="text-ui-fg-subtle text-xs">End Date</Text>
                <Text className="font-medium">
                  {service_fee.end_date
                    ? new Date(service_fee.end_date).toLocaleDateString()
                    : "Not Set"}
                </Text>
              </div>
            </div>
            {!service_fee.start_date && !service_fee.end_date && (
              <div className="rounded-lg bg-ui-bg-subtle border border-ui-border-base p-3 mt-4">
                <Text className="text-ui-fg-subtle text-sm">
                  This fee has no custom period and will remain active
                  indefinitely.
                </Text>
              </div>
            )}
          </Container>

          {/* Item Eligibility (if applicable) */}
          {service_fee.charging_level === "item" &&
            service_fee.rules?.length > 0 && (
              <Container>
                <Heading level="h2" className="mb-4">
                  Item Eligibility
                </Heading>
                <div className="space-y-2">
                  <Text className="text-ui-fg-subtle text-xs">
                    Eligibility Type
                  </Text>
                  <Text className="font-medium">Categories</Text>
                  <div className="flex items-center gap-2 mt-2">
                    <Text className="text-ui-fg-subtle text-xs">
                      Selected Categories
                    </Text>
                    <Badge color="blue" size="xsmall">
                      Include
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {service_fee.rules.map((rule: any) => (
                      <Badge key={rule.id} color="grey" size="small">
                        {rule.reference_id}
                      </Badge>
                    ))}
                  </div>
                  <Text className="text-ui-fg-subtle text-xs mt-2">
                    Service fee applies only to the categories listed above
                  </Text>
                </div>
              </Container>
            )}
        </div>

        {/* Right Column - Change Logs */}
        <Container>
          <Heading level="h2" className="mb-4">
            Change Logs
          </Heading>
          {change_logs && change_logs.length > 0 ? (
            <div className="space-y-0">
              {change_logs.map((log: any, i: number) => (
                <div key={log.id} className="relative pl-6 pb-6">
                  {i < change_logs.length - 1 && (
                    <div className="absolute left-[9px] top-4 bottom-0 w-px bg-ui-border-base" />
                  )}
                  <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-ui-bg-interactive border-2 border-ui-border-interactive" />
                  <div>
                    <Text className="font-medium text-sm capitalize">
                      {log.action?.replace(/_/g, " ")}
                    </Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      {log.new_snapshot?.description ??
                        `${log.action} service fee`}
                    </Text>
                    <Text className="text-ui-fg-muted text-xs mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </Text>
                    {log.changed_by && (
                      <Text className="text-ui-fg-muted text-xs">
                        by {log.changed_by}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-ui-fg-subtle text-sm">
              No changes recorded yet
            </Text>
          )}
        </Container>
      </div>
    </div>
  )
}
