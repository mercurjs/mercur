import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button, Input, StatusBadge, Text, toast } from "@medusajs/ui"

import { RouteDrawer } from "@mercurjs/dashboard-shared"
import { useCreateInvite, useInvites } from "../../../hooks/api/invites"

const InviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type InviteFormValues = z.infer<typeof InviteSchema>

const InviteUserPage = () => {
  const { mutateAsync: createInvite, isPending } = useCreateInvite()
  const { invites } = useInvites()

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: {
      email: "",
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createInvite({ email: values.email })
      form.reset()
      toast.success("Invitation sent successfully")
    } catch (e: any) {
      toast.error(e?.message || "Failed to send invitation")
    }
  })

  const getStatusBadge = (invite: any) => {
    if (invite.accepted) {
      return <StatusBadge color="green">Accepted</StatusBadge>
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <StatusBadge color="red">Expired</StatusBadge>
    }
    return <StatusBadge color="orange">Pending</StatusBadge>
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title>Invite Team Member</RouteDrawer.Title>
      </RouteDrawer.Header>
      <RouteDrawer.Body>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex gap-x-2">
            <div className="flex-1">
              <Input
                placeholder="member@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <span className="text-ui-fg-error txt-small mt-1">
                  {form.formState.errors.email.message}
                </span>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="small"
              isLoading={isPending}
            >
              Send Invite
            </Button>
          </div>

          {invites && invites.length > 0 && (
            <div className="flex flex-col gap-y-2">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">
                Pending Invitations
              </Text>
              <div className="divide-y rounded-lg border">
                {invites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <Text size="small" className="text-ui-fg-subtle">
                      {invite.email}
                    </Text>
                    {getStatusBadge(invite)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <div className="flex items-center justify-end">
          <RouteDrawer.Close asChild>
            <Button variant="secondary" size="small">
              Close
            </Button>
          </RouteDrawer.Close>
        </div>
      </RouteDrawer.Footer>
    </RouteDrawer>
  )
}

export default InviteUserPage
