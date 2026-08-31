// Deliberately not semver: the range a patch declares is always a plain
// "verified from this version, up to that one" pair, and pulling a resolver in
// for that would be more machinery than the check deserves.

function parse(version: string): number[] {
  const core = version.split("-")[0]
  return core.split(".").map((part) => Number.parseInt(part, 10) || 0)
}

export function compareVersions(a: string, b: string): number {
  const left = parse(a)
  const right = parse(b)

  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0) return diff > 0 ? 1 : -1
  }

  return 0
}

export function isWithinRange(
  version: string,
  range: { from: string; to: string }
): boolean {
  return (
    compareVersions(version, range.from) >= 0 &&
    compareVersions(version, range.to) < 0
  )
}
