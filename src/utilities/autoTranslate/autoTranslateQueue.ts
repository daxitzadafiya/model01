/**
 * Serializes deferred auto-translate jobs so concurrent page saves do not
 * open overlapping SQLite write transactions (a common cause of SQLITE_CORRUPT).
 */
let chain: Promise<void> = Promise.resolve()

export function enqueueAutoTranslate<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}
