export const eventually = async <T>(
  assertion: () => Promise<T>,
  { timeout = 10000, interval = 200 }: { timeout?: number; interval?: number } = {}
): Promise<T> => {
  const deadline = Date.now() + timeout
  while (true) {
    try {
      return await assertion()
    } catch (e) {
      if (Date.now() > deadline) {
        throw e
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }
}
