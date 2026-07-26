/** Shared by the seed script and the SQLite repository so both produce ids
 *  in the same shape without one depending on the other. */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
