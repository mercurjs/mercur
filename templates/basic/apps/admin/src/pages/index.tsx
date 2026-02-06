export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Welcome to Mercur Admin</h1>
      <p className="text-gray-600 mb-6">
        This is a file-based routing demo. Create files in <code>src/pages/</code> to add new routes.
      </p>
      <nav className="space-y-2">
        <a href="/products" className="block text-blue-600 hover:underline">
          → Products
        </a>
      </nav>
    </div>
  )
}
