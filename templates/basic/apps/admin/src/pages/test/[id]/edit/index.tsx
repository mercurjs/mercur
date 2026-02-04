import { Button, Heading, Input, Label, Text } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"

const TestEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [name, setName] = useState(`Test ${id}`)

  const handleClose = () => navigate("..", { replace: true })

  const handleSave = () => {
    console.log("Zapisuje test:", { id, name })
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-ui-bg-base p-6 shadow-lg">
        <Heading level="h2" className="mb-4">
          Edytuj Test
        </Heading>
        <Text className="mb-4 text-ui-fg-muted">ID: {id ?? "Nieznany"}</Text>

        <div className="mb-4">
          <Label htmlFor="name">Nazwa</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>Zapisz</Button>
        </div>
      </div>
    </div>
  )
}

export const Component = TestEdit
