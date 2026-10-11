const MAX_REQUESTS = 14
const WINDOW_MS = 60_000

const timestamps: number[] = []
let chain: Promise<void> = Promise.resolve()

function pruneOld(now: number) {
  while (timestamps.length > 0 && now - timestamps[0]! >= WINDOW_MS) {
    timestamps.shift()
  }
}

function waitForSlot(): Promise<void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      const now = Date.now()
      pruneOld(now)
      if (timestamps.length < MAX_REQUESTS) {
        timestamps.push(now)
        resolve()
        return
      }
      const waitMs = WINDOW_MS - (now - timestamps[0]!) + 50
      setTimeout(tryAcquire, waitMs)
    }
    tryAcquire()
  })
}

/** Serializes API calls and respects the 15 req / 60s rate limit. */
export function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    await waitForSlot()
    return fn()
  }
  const result = chain.then(run, run)
  chain = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}
