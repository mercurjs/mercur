const Sequencer = require("@jest/test-sequencer").default
const fs = require("fs")
const path = require("path")

/**
 * Balanced shard sequencer.
 *
 * Jest's default `shard()` partitions spec files by a sha1 hash of their path
 * and slices the list evenly *by file count* — it has no notion of how long a
 * file takes. Because each HTTP integration spec boots a full Medusa server and
 * migrates a fresh database, per-file runtime varies by an order of magnitude
 * (a validation-only spec is seconds; `seller/admin/seller.spec.ts` is minutes).
 * Count-based sharding therefore lets several heavy specs land in one shard,
 * which then runs far longer than the others and can blow the job timeout.
 *
 * This sequencer instead bin-packs files across shards by estimated duration
 * using greedy "longest processing time first" (LPT): repeatedly drop the next
 * heaviest spec into whichever shard is currently lightest. The partition is
 * computed identically in every shard process (deterministic ordering), so each
 * shard returns its own slice without coordination.
 *
 * Weights come from `test-timings.json` (measured seconds per spec, relative to
 * the integration-tests root) when available, falling back to a heuristic based
 * on the number of test cases in the file so unseen specs still get a sensible
 * weight with zero maintenance.
 */

let TIMINGS = {}
try {
  TIMINGS = JSON.parse(
    fs.readFileSync(path.join(__dirname, "test-timings.json"), "utf8")
  )
} catch {
  TIMINGS = {}
}

// Heuristic fallback for specs not present in test-timings.json.
const BASE_BOOT_COST = 25 // app boot + DB migration per spec file (seconds)
const PER_TEST_COST = 1.5 // rough average wall time per test case (seconds)

function estimateWeight(test) {
  const rel = path.posix.relative(test.context.config.rootDir, test.path)
  if (typeof TIMINGS[rel] === "number") {
    return TIMINGS[rel]
  }

  let testCount = 0
  try {
    const src = fs.readFileSync(test.path, "utf8")
    testCount = (src.match(/\b(?:it|test)\s*(?:\.\w+)?\s*\(/g) || []).length
  } catch {
    // Unreadable file: treat as a single-test spec.
    testCount = 1
  }
  return BASE_BOOT_COST + testCount * PER_TEST_COST
}

class BalancedSequencer extends Sequencer {
  shard(tests, { shardIndex, shardCount }) {
    const weighted = tests
      .map((test) => ({ test, weight: estimateWeight(test) }))
      // Heaviest first; tie-break on path so every shard process agrees.
      .sort(
        (a, b) =>
          b.weight - a.weight ||
          (a.test.path < b.test.path ? -1 : a.test.path > b.test.path ? 1 : 0)
      )

    const buckets = Array.from({ length: shardCount }, () => ({
      load: 0,
      tests: [],
    }))

    for (const { test, weight } of weighted) {
      let lightest = 0
      for (let i = 1; i < shardCount; i++) {
        if (buckets[i].load < buckets[lightest].load) {
          lightest = i
        }
      }
      buckets[lightest].tests.push(test)
      buckets[lightest].load += weight
    }

    return buckets[shardIndex - 1].tests
  }
}

module.exports = BalancedSequencer
