export const providerIdOf = (data: Record<string, unknown> | null | undefined): string | null => {
  const provider = data?.provider as { id?: unknown } | undefined
  return typeof provider?.id === "string" ? provider.id : null
}
