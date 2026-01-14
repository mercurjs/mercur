export function isUrl(string: string): boolean {
  try {
    const url = new URL(string);
    // Only accept http and https protocols
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isLocalFile(string: string): boolean {
  return (
    string.startsWith("file://") ||
    string.startsWith("./") ||
    string.startsWith("../") ||
    string.startsWith("/")
  );
}
