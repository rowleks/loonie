/** Display formatting helpers (money, postal codes). */

/** e.g. 14900 → "$149.00" */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(cents / 100)
}

/** Normalizes a Canadian postal code to "A1A 1A1" (uppercase, single space). */
export function normalizePostalCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return cleaned.length === 6 ? `${cleaned.slice(0, 3)} ${cleaned.slice(3)}` : cleaned
}

export function isValidPostalCode(raw: string): boolean {
  return /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(raw.toUpperCase().trim())
}

/** One-line address for display and map links. */
export function formatAddress(address: {
  unit?: string | null
  street: string
  city: string
  province: string
  postalCode: string
}): string {
  const unitPart = address.unit ? `${address.unit}-` : ''
  return `${unitPart}${address.street}, ${address.city}, ${address.province} ${address.postalCode}`
}

/** Plain directions link — no maps SDK, per PRD §7 (maps deferred). */
export function mapsDirectionsUrl(address: {
  unit?: string | null
  street: string
  city: string
  province: string
  postalCode: string
}): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(address))}`
}
