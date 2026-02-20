import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, Input } from "@medusajs/ui"

import { RouteDrawer, useRouteModal } from "@mercurjs/dashboard-shared"
import { useMember, useUpdateMember } from "../../../../hooks/api/members"

const EditMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

type EditMemberFormValues = z.infer<typeof EditMemberSchema>

const EditMemberForm = ({
  member,
}: {
  member: { id: string; name: string }
}) => {
  const { handleSuccess } = useRouteModal()
  const { mutateAsync: updateMember, isPending } = useUpdateMember(member.id)

  const form = useForm<EditMemberFormValues>({
    resolver: zodResolver(EditMemberSchema),
    defaultValues: {
      name: member.name || "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await updateMember(values)
    handleSuccess()
  })

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <RouteDrawer.Body>
        <div className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-2">
            <label htmlFor="name" className="text-ui-fg-subtle txt-small">
              Name
            </label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <span className="text-ui-fg-error txt-small">
                {form.formState.errors.name.message}
              </span>
            )}
          </div>
        </div>
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <RouteDrawer.Close asChild>
            <Button variant="secondary" size="small">
              Cancel
            </Button>
          </RouteDrawer.Close>
          <Button
            type="submit"
            size="small"
            isLoading={isPending}
          >
            Save
          </Button>
        </div>
      </RouteDrawer.Footer>
    </form>
  )
}

const EditUserPage = () => {
  const { id } = useParams()
  const { member, isLoading } = useMember(id!)

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title>Edit Team Member</RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && member && <EditMemberForm member={member} />}
    </RouteDrawer>
  )
}

export default EditUserPage
