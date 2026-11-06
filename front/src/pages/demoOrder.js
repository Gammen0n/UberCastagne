// Demo data for /orders/demo only, shown with a "Demo data" banner until the Order service exists.
// It follows the Order and Step schemas of the SAD (section 3.3) and replays Sequence 2:
// a Show where fighter B declines, so fighter A's reserved slot is compensated.
// `fighters`, `venue` and `steps[].updatedAt` are not in the SAD schema yet; see the PR notes.

const hoursAgo = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString()
const inDays = (days) => new Date(Date.now() + days * 86400 * 1000).toISOString()

export function demoOrder() {
  return {
    id: 'demo',
    package: 'SHOW',
    status: 'FAILED',
    fightAt: inDays(12),
    fighters: [
      { id: 'f0000000-0000-4000-8000-000000000001', displayName: 'Le Marteau' },
      { id: 'f0000000-0000-4000-8000-000000000006', displayName: 'Sofia la Tornade' },
    ],
    venue: { name: 'Club Bayonne Combat', city: 'Bayonne' },
    price: {
      fighters: { amount: 75000, currency: 'EUR' },
      venue: { amount: 10000, currency: 'EUR' },
      referee: { amount: 6000, currency: 'EUR' },
      insurance: { amount: 4000, currency: 'EUR' },
      fees: { amount: 9500, currency: 'EUR' },
      total: { amount: 104500, currency: 'EUR' },
    },
    steps: [
      {
        name: 'FIGHTER_A',
        status: 'COMPENSATED',
        updatedAt: hoursAgo(1),
        reason: 'Le Marteau had accepted. Their reserved slot was released because the order could not go ahead.',
      },
      {
        name: 'FIGHTER_B',
        status: 'FAILED',
        updatedAt: hoursAgo(1.2),
        reason: 'Sofia la Tornade declined the fight. Nothing was reserved at the venue and you have not been charged.',
      },
    ],
  }
}
