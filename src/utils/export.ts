import type { Channel } from '../types'

export function dl(text: string, filename: string, mime = 'application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function stripInternal({ _key: _k, _hasMeta: _h, _localEdit: _l, ...rest }: Channel) {
  return rest
}

export function exportRtfm(channels: Channel[], filename = 'remote-terminal-export.txt') {
  const date = new Date().toISOString().slice(0, 10)
  const header = `# MeshCore Channel Export - ${date}\n# Format: #channel-name - 32-char-hex-key\n# Import this file in Remote Terminal for MeshCore via Channels → Import\n\n`
  dl(header + channels.map(c => `${c.channel} - ${c._key}`).join('\n'), filename, 'text/plain')
}

export function exportTxt(channels: Channel[], filename = 'channels.txt') {
  dl(channels.map(c => c.channel).join('\n'), filename, 'text/plain')
}

export function exportJson(channels: Channel[], filename = 'channels.json') {
  dl(JSON.stringify(channels.map(stripInternal), null, 2), filename)
}

export function exportCoreScope(channels: Channel[]) {
  // Build channelKeys object and hashChannels array
  const channelKeys: Record<string, string> = {}
  const hashChannelsSet = new Set<string>()

  channels.forEach(c => {
    const hash = (c.channel_hash || '').toLowerCase()
    const channelName = c.channel.toLowerCase()
    if (hash) {
      channelKeys[channelName] = hash
      hashChannelsSet.add(channelName)
    }
  })

  // Sort hashChannels alphabetically
  const hashChannels = Array.from(hashChannelsSet).sort()

  // Export CoreScopeConfig.json
  const configData = {
    channelKeys,
    hashChannels
  }
  dl(JSON.stringify(configData, null, 2), 'CoreScopeConfig.json')

  // Export CoreScope-channel-rainbow.json (simple mapping)
  dl(JSON.stringify(channelKeys, null, 2), 'CoreScope-channel-rainbow.json')
}
