import { sections, items } from "virtual:mercur-navigation"

console.log("Navigation sections:", sections)
console.log("Navigation items:", items)

export default function TestNavigation() {
  return (
    <div>
      <h1>Navigation Test</h1>
      <h2>Sections ({sections.length})</h2>
      <pre>{JSON.stringify(sections, null, 2)}</pre>
      <h2>Items ({items.length})</h2>
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </div>
  )
}
