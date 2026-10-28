/**
 * Next match for a five-field cron expression (minute hour dom month dow),
 * supporting `*`, lists, ranges and steps. Enough for the job schedules;
 * not a general cron parser.
 */
export function nextCronRun(expression: string, from: Date): Date | null {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== 5) return null

  const parse = (field: string, min: number, max: number): Set<number> => {
    const out = new Set<number>()
    for (const part of field.split(",")) {
      const [rangePart, stepPart] = part.split("/")
      const step = stepPart ? parseInt(stepPart, 10) : 1
      let lo = min
      let hi = max
      if (rangePart !== "*") {
        const [a, b] = rangePart.split("-").map((v) => parseInt(v, 10))
        lo = a
        hi = b ?? (stepPart ? max : a)
      }
      for (let v = lo; v <= hi; v += step) out.add(v)
    }
    return out
  }

  const minutes = parse(fields[0], 0, 59)
  const hours = parse(fields[1], 0, 23)
  const doms = parse(fields[2], 1, 31)
  const months = parse(fields[3], 1, 12)
  const dows = parse(fields[4], 0, 6)

  const candidate = new Date(from.getTime())
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)

  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (
      months.has(candidate.getUTCMonth() + 1) &&
      doms.has(candidate.getUTCDate()) &&
      dows.has(candidate.getUTCDay()) &&
      hours.has(candidate.getUTCHours()) &&
      minutes.has(candidate.getUTCMinutes())
    ) {
      return candidate
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
  }
  return null
}
