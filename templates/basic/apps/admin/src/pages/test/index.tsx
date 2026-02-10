import { Container, Heading, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"

export const nav = {
  id: "test",
  label: "Test",
  iconKey: "star",
  section: "general",
  order: 100,
}

const TestList = () => {
  const items = [
    { id: "test_001", name: "Test Pierwszy" },
    { id: "test_002", name: "Test Drugie" },
    { id: "test_003", name: "Test Trzecie" },
  ]

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Testy</Heading>
        <Link
          to="/test/create"
          className="rounded-md bg-ui-button-inverted px-3 py-1.5 text-sm text-ui-fg-on-inverted"
        >
          Dodaj test
        </Link>
      </div>
      <div className="flex flex-col">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/test/${item.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-ui-bg-subtle"
          >
            <Text>{item.name}</Text>
            <Text className="text-ui-fg-muted">{item.id}</Text>
          </Link>
        ))}
      </div>
    </Container>
  )
}

export const Component = TestList
