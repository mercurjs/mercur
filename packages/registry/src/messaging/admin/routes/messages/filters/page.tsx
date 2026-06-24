import { useState } from "react"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"

import {
  useAdminFilters,
  useCreateFilter,
  useUpdateFilter,
  useDeleteFilter,
  FilterRuleDTO,
} from "../../../hooks/api/filters"

const FilterRow = ({
  rule,
  onDelete,
}: {
  rule: FilterRuleDTO
  onDelete: (id: string) => void
}) => {
  const updateFilter = useUpdateFilter(rule.id)

  const handleToggle = (checked: boolean) => {
    updateFilter.mutate(
      { is_enabled: checked },
      { onSuccess: () => toast.success(`Rule ${checked ? "enabled" : "disabled"}`) }
    )
  }

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge color={rule.is_builtin ? "purple" : "grey"} size="2xsmall">
            {rule.is_builtin ? "Built-in" : rule.match_type}
          </Badge>
          <Text size="small" leading="compact" weight="plus" className="truncate">
            {rule.pattern}
          </Text>
        </div>
        {rule.description && (
          <Text size="xsmall" className="text-ui-fg-subtle mt-0.5">
            {rule.description}
          </Text>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Switch
          checked={rule.is_enabled}
          onCheckedChange={handleToggle}
          disabled={updateFilter.isPending}
        />
        {!rule.is_builtin && (
          <Button
            size="small"
            variant="danger"
            onClick={() => onDelete(rule.id)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}

const AdminFiltersPage = () => {
  const { filter_rules, isLoading, isError, error } = useAdminFilters()
  const createFilter = useCreateFilter()
  const deleteFilter = useDeleteFilter()

  const [showForm, setShowForm] = useState(false)
  const [formState, setFormState] = useState({
    match_type: "exact" as "exact" | "contains",
    pattern: "",
    description: "",
  })

  if (isError) throw error

  const handleCreate = () => {
    if (!formState.pattern.trim()) return
    createFilter.mutate(
      {
        match_type: formState.match_type,
        pattern: formState.pattern.trim(),
        description: formState.description || undefined,
      },
      {
        onSuccess: () => {
          setFormState({ match_type: "exact", pattern: "", description: "" })
          setShowForm(false)
          toast.success("Filter rule created")
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    deleteFilter.mutate(id, {
      onSuccess: () => toast.success("Filter rule deleted"),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Content Filters</Heading>
          <Button size="small" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Rule"}
          </Button>
        </div>

        {showForm && (
          <div className="border-t border-ui-border-base px-6 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label size="xsmall">Match Type</Label>
                <Select
                  value={formState.match_type}
                  onValueChange={(v) =>
                    setFormState((s) => ({ ...s, match_type: v as any }))
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="exact">Exact Match</Select.Item>
                    <Select.Item value="contains">Contains</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div>
                <Label size="xsmall">Pattern</Label>
                <Input
                  size="small"
                  placeholder="Word or phrase to filter..."
                  value={formState.pattern}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, pattern: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label size="xsmall">Description (optional)</Label>
                <Input
                  size="small"
                  placeholder="Why this filter exists..."
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-3">
              <Button
                size="small"
                onClick={handleCreate}
                disabled={!formState.pattern.trim() || createFilter.isPending}
                isLoading={createFilter.isPending}
              >
                Create Rule
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y border-t border-ui-border-base">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Text className="text-ui-fg-muted">Loading...</Text>
            </div>
          ) : !filter_rules?.length ? (
            <div className="flex items-center justify-center py-12">
              <Text className="text-ui-fg-muted">No filter rules configured</Text>
            </div>
          ) : (
            filter_rules.map((rule) => (
              <FilterRow
                key={rule.id}
                rule={rule}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </Container>
    </div>
  )
}

export default AdminFiltersPage
