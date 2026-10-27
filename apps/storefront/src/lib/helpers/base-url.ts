// Reading the host header would make every page request-time; the public URL
// comes from the environment so pages and metadata can be prerendered.
export const getBaseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
