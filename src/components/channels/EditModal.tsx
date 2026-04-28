import { useState, useEffect, useId } from 'react'
import type { Channel, ChannelMeta } from '../../types'
import type { CategoryEntry } from '../../hooks/useCategoryMap'

interface Props {
  channel: Channel | null
  serverMode: boolean
  categoryMap: Record<string, CategoryEntry>
  onSave: (name: string, patch: Partial<ChannelMeta>) => void
  onClearMeta: (name: string) => void
  onClose: () => void
}

function parseList(s: string): string[] {
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

export default function EditModal({ channel, serverMode, categoryMap, onSave, onClearMeta, onClose }: Props) {
  const catListId = useId()
  const subListId = useId()

  const [category,    setCategory]    = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [country,     setCountry]     = useState('')
  const [region,      setRegion]      = useState('')
  const [language,    setLanguage]    = useState('')
  const [scopes,      setScopes]      = useState('')
  const [tags,        setTags]        = useState('')
  const [notes,       setNotes]       = useState('')
  const [lastSeen,    setLastSeen]    = useState('')
  const [added,       setAdded]       = useState('')
  const [verified,    setVerified]    = useState(false)
  const [recommended, setRecommended] = useState(false)

  useEffect(() => {
    if (!channel) return
    setCategory(channel.category    || '')
    setSubcategory(channel.subcategory || '')
    setCountry(channel.country     || '')
    setRegion(channel.region      || '')
    setLanguage((channel.language || []).join(', '))
    setScopes((channel.scopes   || []).join(', '))
    setTags((channel.tags     || []).join(', '))
    setNotes(channel.notes      || '')
    setLastSeen(channel.last_seen  || '')
    setAdded(channel.added      || '')
    setVerified(channel.verified    ?? false)
    setRecommended(channel.recommended ?? false)
  }, [channel])

  if (!channel) return null

  const selectedCatKey = category.trim().toLowerCase()
  const subOptions = selectedCatKey && categoryMap[selectedCatKey]
    ? [...categoryMap[selectedCatKey].subs].sort()
    : []

  function handleSave() {
    if (!channel) return
    const patch: Partial<ChannelMeta> = {
      channel: channel.channel,
    }
    if (category)    patch.category    = category.trim()
    if (subcategory) patch.subcategory = subcategory.trim()
    if (country)     patch.country     = country.trim()
    if (region)      patch.region      = region.trim()
    const langArr = parseList(language)
    if (langArr.length) patch.language = langArr
    const scopeArr = parseList(scopes)
    if (scopeArr.length) patch.scopes = scopeArr
    const tagArr = parseList(tags)
    if (tagArr.length) patch.tags = tagArr
    if (notes)    patch.notes    = notes.trim()
    if (lastSeen) patch.last_seen = lastSeen
    if (added)    patch.added    = added
    patch.verified    = verified
    patch.recommended = recommended
    onSave(channel.channel, patch)
    onClose()
  }

  function handleClear() {
    if (!channel) return
    if (confirm(`Clear all metadata for ${channel.channel}?`)) {
      onClearMeta(channel.channel)
      onClose()
    }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>Edit channel metadata</h2>
            <div className="channel-sub">{channel.channel}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!serverMode && (
            <div className="info-banner warn">
              ⚠ No local server — edits stored in browser localStorage only.
            </div>
          )}

          <div className="form-row-2">
            <div className="form-row">
              <label>Category</label>
              <input
                type="text"
                list={catListId}
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Regional"
              />
              <datalist id={catListId}>
                {Object.values(categoryMap).map(e => (
                  <option key={e.display} value={e.display} />
                ))}
              </datalist>
            </div>
            <div className="form-row">
              <label>Subcategory</label>
              <input
                type="text"
                list={subListId}
                value={subcategory}
                onChange={e => setSubcategory(e.target.value)}
                placeholder="e.g. City"
              />
              <datalist id={subListId}>
                {subOptions.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Country</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. Netherlands"
              />
            </div>
            <div className="form-row">
              <label>Region</label>
              <input
                type="text"
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="e.g. Noord-Holland"
              />
            </div>
          </div>

          <div className="form-row">
            <label>Language</label>
            <input
              type="text"
              value={language}
              onChange={e => setLanguage(e.target.value)}
              placeholder="Comma-separated, e.g. nl, en"
            />
            <span className="form-hint">Comma-separated list</span>
          </div>

          <div className="form-row">
            <label>Scopes</label>
            <input
              type="text"
              value={scopes}
              onChange={e => setScopes(e.target.value)}
              placeholder="e.g. nl, nl-nh, nl-nh-dhr"
            />
            <span className="form-hint">Comma-separated. Follow the MeshWiki region guideline.</span>
          </div>

          <div className="form-row">
            <label>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. Emergency, Repeater"
            />
            <span className="form-hint">Comma-separated</span>
          </div>

          <div className="form-row">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes…"
            />
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Last seen</label>
              <input
                type="date"
                value={lastSeen}
                onChange={e => setLastSeen(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Added</label>
              <input
                type="date"
                value={added}
                onChange={e => setAdded(e.target.value)}
              />
            </div>
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="edit-verified"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
            />
            <label htmlFor="edit-verified">Verified channel</label>
          </div>

          <div className="checkbox-row">
            <input
              type="checkbox"
              id="edit-recommended"
              checked={recommended}
              onChange={e => setRecommended(e.target.checked)}
            />
            <label htmlFor="edit-recommended">Recommended channel</label>
          </div>
        </div>

        <div className="modal-foot">
          {channel._hasMeta && (
            <button className="btn btn-danger" onClick={handleClear}>
              Clear metadata
            </button>
          )}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}
