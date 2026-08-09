/**
 * Derives human-readable countries and Dutch provinces from MeshCore scope tags.
 *
 * The analyzer feed tags each channel with scopes like `nl`, `nl-dr`, `de-bw`,
 * `de-bw-str`, `europe`, `hansemesh`. The country is the token before the first
 * `-`; only recognised ISO-style country codes are surfaced (aggregate/community
 * scopes such as `europe`, `dach`, `bremesh` are ignored). Regions are limited to
 * the twelve Dutch provinces — this is the DutchMeshCore toolbox, and mapping every
 * European sub-region would flood the filter with noise. Unmapped scopes stay
 * visible in the Scopes column regardless.
 */

/** Country token (before the first `-`) → display name. */
export const SCOPE_COUNTRY: Record<string, string> = {
  nl: 'Netherlands',
  de: 'Germany',
  be: 'Belgium',
  at: 'Austria',
  ch: 'Switzerland',
  fr: 'France',
  dk: 'Denmark',
  se: 'Sweden',
  no: 'Norway',
  fi: 'Finland',
  pl: 'Poland',
  cz: 'Czechia',
  ro: 'Romania',
  bg: 'Bulgaria',
  it: 'Italy',
  es: 'Spain',
  pt: 'Portugal',
  ie: 'Ireland',
  lu: 'Luxembourg',
  gb: 'United Kingdom',
  hu: 'Hungary',
  gr: 'Greece',
  hr: 'Croatia',
  si: 'Slovenia',
  sk: 'Slovakia',
  rs: 'Serbia',
  ba: 'Bosnia and Herzegovina',
  mk: 'North Macedonia',
  me: 'Montenegro',
  al: 'Albania',
  ee: 'Estonia',
  lv: 'Latvia',
  lt: 'Lithuania',
  ua: 'Ukraine',
  md: 'Moldova',
  by: 'Belarus',
  tr: 'Turkey',
  is: 'Iceland',
  mt: 'Malta',
  cy: 'Cyprus',
  li: 'Liechtenstein',
  au: 'Australia',
  nz: 'New Zealand',
  us: 'United States',
  ca: 'Canada',
}

/** Exact Dutch province scope code → province name. */
export const SCOPE_REGION: Record<string, string> = {
  'nl-dr': 'Drenthe',
  'nl-fl': 'Flevoland',
  'nl-fr': 'Friesland',
  'nl-ge': 'Gelderland',
  'nl-gr': 'Groningen',
  'nl-li': 'Limburg',
  'nl-nb': 'Noord-Brabant',
  'nl-nh': 'Noord-Holland',
  'nl-ov': 'Overijssel',
  'nl-ut': 'Utrecht',
  'nl-ze': 'Zeeland',
  'nl-zh': 'Zuid-Holland',
}

/** Ordered, de-duplicated country names for a channel's scopes. */
export function deriveCountries(scopes: string[] | undefined): string[] {
  const out: string[] = []
  for (const scope of scopes ?? []) {
    const token = scope.split('-', 1)[0]
    const name = SCOPE_COUNTRY[token]
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

/** Ordered, de-duplicated Dutch-province names for a channel's scopes. */
export function deriveRegions(scopes: string[] | undefined): string[] {
  const out: string[] = []
  for (const scope of scopes ?? []) {
    const name = SCOPE_REGION[scope]
    if (name && !out.includes(name)) out.push(name)
  }
  return out
}

/** True when any scope is the Dutch national scope or a Dutch sub-scope. */
export function isDutchScopes(scopes: string[] | undefined): boolean {
  return (scopes ?? []).some(s => s === 'nl' || s.startsWith('nl-'))
}
