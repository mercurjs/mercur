import { Button, Heading, Input, Label } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const TestCreate = () => {
  const navigate = useNavigate()
  const [name, setName] = useState("")

  const handleClose = () => navigate("..", { replace: true })

  const handleCreate = () => {
    console.log("Tworze nowe test:", { name })
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-ui-bg-base p-6 shadow-lg">
        <Heading level="h2" className="mb-4">
          Nowy test
        </Heading>

        <div className="mb-4">
          <Label htmlFor="name">Nazwa</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wpisz nazwe testu..."
            className="mt-1"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Anuluj
          </Button>
          <Button onClick={handleCreate}>Stworz</Button>
        </div>
      </div>
    </div>
  )
}

export const Component = TestCreate
