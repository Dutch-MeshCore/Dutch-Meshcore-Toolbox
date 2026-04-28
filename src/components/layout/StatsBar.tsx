import type { Channel } from '../../types'
import { useLang } from '../../hooks/useLang'

export default function StatsBar({ channels }: { channels: Channel[] }) {
  const { t } = useLang()

  const total    = channels.length
  const messages = channels.reduce((s, c) => s + (c.message_amount ?? 0), 0)
  const scoped   = channels.filter(c => c.scopes?.length).length
  const sub      = (c: Channel) => (c.subcategory ?? '').toLowerCase()
  const cities   = channels.filter(c => sub(c) === 'city').length
  const provinces = channels.filter(c => sub(c) === 'province').length
  const countries = new Set(channels.map(c => c.country).filter(Boolean)).size

  const stats: [number, string][] = [
    [total,     t('stat_total')],
    [messages,  t('stat_messages')],
    [scoped,    t('stat_scoped')],
    [cities,    t('stat_cities')],
    [provinces, t('stat_provinces')],
    [countries, t('stat_countries')],
  ]

  return (
    <div className="stats">
      {stats.map(([v, l]) => (
        <div className="stat" key={l}>
          <span className="stat-value">{v.toLocaleString()}</span>
          <span className="stat-label">{l}</span>
        </div>
      ))}
    </div>
  )
}
