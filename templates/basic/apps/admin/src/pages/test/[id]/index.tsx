import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useParams, Link } from "react-router-dom"

const TestDetail = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Test Detail</Heading>
          <Text className="text-ui-fg-muted">ID: {id}</Text>
        </div>
        <Link to={`/test/${id}/edit`}>
          <Button variant="secondary">Edytuj</Button>
        </Link>
      </div>
      <div className="px-6 py-4">
        <Text>To jest strona detali testu o ID: {id}</Text>
        <Text className="mt-2 text-ui-fg-muted">
          Kliknij "Edytuj" aby otworzyc modal edycji nad ta strona.
        </Text>
      </div>
    </Container>
  )
}

export const Component = TestDetail

export const Breadcrumb = () => {
  const { id } = useParams<{ id: string }>()
  return <span>Test {id}</span>
}
