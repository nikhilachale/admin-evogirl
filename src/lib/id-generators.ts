// Client-side id factories for manually created records. There is no
// backend yet, so the "log a contact" flow mints ids locally. Message ids
// keep using crypto.randomUUID() inline like the rest of the store.

/**
 * Next ticket id, numerically above any existing id. Seed/mock ids are in
 * the ~TKT-2400 range, so manual tickets start at TKT-90001 to stay visibly
 * distinct and collision-free.
 */
export function nextTicketId(existing: { id: string }[]): string {
  const max = existing.reduce((m, t) => {
    const n = /^TKT-(\d+)$/.exec(t.id);
    return n ? Math.max(m, Number(n[1])) : m;
  }, 90000);
  return `TKT-${max + 1}`;
}

/** New customer id for a contact that isn't tied to an existing customer. */
export function newCustomerId(): string {
  return `CUS-${Date.now().toString().slice(-7)}`;
}
