type SerializedBuffer = { type: "Buffer"; data: number[] | ArrayBuffer }

// The event bus serializes a Buffer to `{ type: "Buffer", data }`, and the
// signature has to be checked against the original bytes.
export function reviveRawData(rawData: unknown): string | Buffer | null {
  if ((rawData as SerializedBuffer | null)?.type === "Buffer") {
    const { data } = rawData as SerializedBuffer
    return Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data)
  }
  if (typeof rawData === "string" || Buffer.isBuffer(rawData)) {
    return rawData
  }
  return null
}
