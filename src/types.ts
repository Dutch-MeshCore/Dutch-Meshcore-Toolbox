export interface ChannelMeta {
  channel: string
  channel_hash?: string | null
  category?: string
  subcategory?: string
  country?: string
  region?: string
  language?: string[]
  scopes?: string[]
  tags?: string[]
  notes?: string
  alias_of?: string | null
  status?: string
  source?: string
  first_seen?: string | null
  last_seen?: string | null
  added?: string | null
  verified?: boolean
  recommended?: boolean
  message_amount?: number
}

export interface Channel extends ChannelMeta {
  _key: string
  _hasMeta: boolean
  _localEdit: boolean
}

export type SortField = 'alpha' | 'category' | 'subcategory' | 'country' | 'region' | 'scope' | 'first_seen' | 'last_seen' | 'message_amount'
export type SortDir = 'asc' | 'desc'
export type ViewMode = 'grid' | 'list'
export type ToastType = 'ok' | 'err'

export interface ToastMsg {
  id: number
  msg: string
  type: ToastType
}

export interface FilterState {
  search: string
  category: string
  subcategory: string
  region: string
  scope: string
  country: string
  onlyScoped: boolean
  onlyBare: boolean
  minMessages: number
}
