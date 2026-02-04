/**
 * Test modal page to verify isModal detection works
 * This modal should:
 * 1. Be detected as modal via isModal export
 * 2. Render over parent /sellers/:id
 * 3. Navigate back to /sellers/:id on close (not /orders)
 */
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"

// Explicit modal declaration - this is detected by vite plugin
export const isModal = true

export const Component = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const handleClose = () => {
    // This should go to parent: /sellers/:id
    navigate("..", { replace: true })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Container className="bg-ui-bg-base rounded-lg shadow-xl max-w-md w-full p-6">
        <Heading level="h2" className="mb-4">Test Modal</Heading>
        <div className="flex flex-col gap-4">
          <Text>
            This is a test modal for seller ID: <strong>{id}</strong>
          </Text>
          <Text className="text-ui-fg-subtle">
            If routing works correctly:
          </Text>
          <ul className="list-disc list-inside text-ui-fg-subtle text-sm">
            <li>This modal renders over the seller detail page</li>
            <li>Clicking Close returns to /sellers/{id}</li>
            <li>The parent page content should be visible underneath (via Outlet)</li>
          </ul>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Container>
    </div>
  )
}
