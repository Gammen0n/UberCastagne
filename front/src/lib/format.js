// Display helpers. Every function returns '—' when the value is missing, so a label is never left empty.

export const EMPTY = '—'

const isMissing = (value) => value === null || value === undefined || value === ''

// Amounts come from the API as { amount: integer cents, currency }.
export function formatMoney(money) {
  if (!money || isMissing(money.amount)) return EMPTY
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: money.currency ?? 'EUR',
    maximumFractionDigits: 0,
  }).format(money.amount / 100)
}

const ACRONYMS = new Set(['MMA'])

// BOXING -> Boxing, MUAY_THAI -> Muay Thai, MMA -> MMA
export function formatCode(code) {
  if (isMissing(code)) return EMPTY
  return String(code)
    .split('_')
    .map((word) => (ACRONYMS.has(word) ? word : word.charAt(0) + word.slice(1).toLowerCase()))
    .join(' ')
}

export function formatNumber(value, unit) {
  if (isMissing(value)) return EMPTY
  return unit ? `${value} ${unit}` : String(value)
}

export function formatRecord(record) {
  if (!record || [record.wins, record.losses, record.draws].some(isMissing)) return EMPTY
  return `${record.wins}-${record.losses}-${record.draws}`
}

export function formatRating(rating) {
  return isMissing(rating) ? EMPTY : Number(rating).toFixed(1)
}

export function formatDateTime(iso) {
  if (isMissing(iso)) return EMPTY
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function initials(...names) {
  const letters = names.filter(Boolean).map((name) => name.trim()[0]).join('')
  return letters.slice(0, 2).toUpperCase() || '?'
}

// Lowest package rate of a fighter, used for "From …" on cards and for the price filter.
export function lowestRate(rates) {
  const amounts = Object.values(rates ?? {}).filter((rate) => rate && !isMissing(rate.amount))
  if (!amounts.length) return null
  return amounts.reduce((lowest, rate) => (rate.amount < lowest.amount ? rate : lowest))
}

// "Friday 13 November"
export function formatDay(iso) {
  if (isMissing(iso)) return EMPTY
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
}

// "Fri 13 Nov"
export function formatShortDay(iso) {
  if (isMissing(iso)) return EMPTY
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso))
}

// "18:00–20:00"
export function formatTimeRange(startIso, endIso) {
  if (isMissing(startIso)) return EMPTY
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
  return isMissing(endIso) ? time.format(new Date(startIso)) : `${time.format(new Date(startIso))}–${time.format(new Date(endIso))}`
}

// Local calendar day, used to group slots by day.
export function dayKey(iso) {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}
