export async function computeChannelHash(hexKey: string): Promise<string> {
  const bytes = new Uint8Array(hexKey.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const firstByte = new Uint8Array(hashBuffer)[0]
  return firstByte.toString(16).padStart(2, '0')
}
