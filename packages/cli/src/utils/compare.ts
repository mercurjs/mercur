export function isContentSame(
  existingContent: string,
  newContent: string,
  options: {
    ignoreImports?: boolean;
  } = {}
) {
  const { ignoreImports = false } = options;

  const normalizedExisting = existingContent.replace(/\r\n/g, "\n").trim();
  const normalizedNew = newContent.replace(/\r\n/g, "\n").trim();

  if (normalizedExisting === normalizedNew) {
    return true;
  }

  if (!ignoreImports) {
    return false;
  }

  const importRegex =
    /^(import\s+(?:type\s+)?(?:\*\s+as\s+\w+|\{[^}]*\}|\w+)?(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+["'])([^"']+)(["'])/gm;

  const normalizeImports = (content: string) => {
    return content.replace(
      importRegex,
      (_match, prefix, importPath, suffix) => {
        if (importPath.startsWith(".")) {
          return `${prefix}${importPath}${suffix}`;
        }

        const parts = importPath.split("/");
        const lastPart = parts[parts.length - 1];

        return `${prefix}@normalized/${lastPart}${suffix}`;
      }
    );
  };

  const existingNormalized = normalizeImports(normalizedExisting);
  const newNormalized = normalizeImports(normalizedNew);

  return existingNormalized === newNormalized;
}
