import { useState } from 'react'
import { useLang } from '../../hooks/useLang'
import RegionShareControls from './RegionShareControls'
import {
  type RegionSettings, type RegionNode, type Neighbor,
  cloneRegionSettings, parseNeighbors,
} from '../../lib/config/regionCommands'

interface Props {
  value: RegionSettings
  onChange: (next: RegionSettings) => void
  onSendCommand: (cmd: string) => Promise<string>
}

function mutateTree(root: RegionNode, target: RegionNode, fn: (n: RegionNode) => void): RegionNode {
  const clone = (n: RegionNode): RegionNode => {
    const copy: RegionNode = { name: n.name, flood: n.flood, children: n.children.map(clone) }
    if (n === target) fn(copy)
    return copy
  }
  return clone(root)
}

function removeNode(root: RegionNode, target: RegionNode): RegionNode {
  const clone = (n: RegionNode): RegionNode => ({
    name: n.name, flood: n.flood,
    children: n.children.filter(c => c !== target).map(clone),
  })
  return clone(root)
}

// Vanilla region tree + zero-hop neighbour discovery: base repeater features
// (v1.10+). Duty-cycle region gating (dc.gate) lives in RegionGatingForm and is
// DMC MQTT observer firmware only.
export default function RegionSettingsForm({ value, onChange, onSendCommand }: Props) {
  const { t } = useLang()
  const [neighbors, setNeighbors] = useState<Neighbor[]>([])
  const [discoverMsg, setDiscoverMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const patch = (p: Partial<RegionSettings>) => onChange({ ...cloneRegionSettings(value), ...p })
  const setTree = (tree: RegionNode) => patch({ tree })

  const runNeighborCmd = async (cmd: 'discover.neighbors' | 'discover.scopes' | 'neighbors') => {
    setBusy(true)
    try {
      // Surface the discover command's own reply (e.g. "OK" or a queue/wait
      // message) so a scopes publish is visibly confirmed, then refresh the list.
      setDiscoverMsg(cmd !== 'neighbors' ? (await onSendCommand(cmd)).trim() : '')
      setNeighbors(parseNeighbors(await onSendCommand('neighbors')))
    } finally { setBusy(false) }
  }

  // key is a stable index path (not the editable name) so typing a name does not
  // remount the input and steal focus.
  function renderNode(node: RegionNode, depth: number, isRoot: boolean, path: string) {
    return (
      <div key={path} style={{ marginLeft: depth ? 18 : 0 }}>
        <div className="region-row">
          {isRoot ? (
            <span className="region-wildcard">*</span>
          ) : (
            <input
              className="region-name-input"
              value={node.name}
              aria-label="region name"
              onChange={e => setTree(mutateTree(value.tree, node, n => { n.name = e.target.value }))}
            />
          )}
          <label className="check-row region-flag">
            <input
              type="checkbox"
              checked={node.flood}
              onChange={e => setTree(mutateTree(value.tree, node, n => { n.flood = e.target.checked }))}
            />
            {t('region_flood_allowed')}
          </label>
          {!isRoot && (
            <>
              <label className="check-row region-flag">
                <input
                  type="radio" name="region-home"
                  checked={value.home === node.name}
                  onChange={() => patch({ home: node.name })}
                />
                {t('region_home')}
              </label>
              <label className="check-row region-flag">
                <input
                  type="radio" name="region-default"
                  checked={value.default === node.name}
                  onChange={() => patch({ default: node.name })}
                />
                {t('region_default')}
              </label>
            </>
          )}
          <button
            className="btn region-btn" type="button"
            onClick={() => setTree(mutateTree(value.tree, node, n => {
              n.children = [...n.children, { name: 'new', flood: true, children: [] }]
            }))}
          >
            + {t('region_add_child')}
          </button>
          {!isRoot && (
            <button className="btn region-btn" type="button" onClick={() => setTree(removeNode(value.tree, node))}>
              🗑
            </button>
          )}
        </div>
        {node.children.map((c, i) => renderNode(c, depth + 1, false, `${path}.${i}`))}
      </div>
    )
  }

  return (
    <div>
      <div className="panel-legend">{t('region_tree')}</div>
      <div className="region-tree">{renderNode(value.tree, 0, true, 'root')}</div>

      <div className="panel-legend" style={{ marginTop: '.75rem' }}>{t('region_neighbors')}</div>
      <div className="action-bar">
        <button className="btn" type="button" disabled={busy} onClick={() => runNeighborCmd('discover.neighbors')}>
          {t('region_discover_neighbors')}
        </button>
        <button className="btn" type="button" disabled={busy} onClick={() => runNeighborCmd('discover.scopes')}>
          {t('region_discover_scopes')}
        </button>
        <button className="btn" type="button" disabled={busy} onClick={() => runNeighborCmd('neighbors')}>
          {t('region_refresh_neighbors')}
        </button>
      </div>
      <div className="region-hint">{t('region_scopes_hint')}</div>
      {discoverMsg && <div className="region-discover-msg">→ {discoverMsg}</div>}
      {neighbors.length > 0 && (
        <table className="region-neighbors-table" style={{ marginTop: '.4rem' }}>
          <thead><tr><th>pubkey</th><th>SNR (dB)</th><th>age (s)</th></tr></thead>
          <tbody>
            {neighbors.map(n => (
              <tr key={n.pubkey}><td>{n.pubkey}</td><td>{n.snr}</td><td>{n.ageSecs}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <RegionShareControls value={value} onImport={onChange} />
    </div>
  )
}
