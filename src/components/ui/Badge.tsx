export type BadgeVariant = 'verified' | 'recommended' | 'no-meta'

export default function Badge({ variant }: { variant: BadgeVariant }) {
  if (variant === 'verified')    return <span className="badge badge-verified">✓ verified</span>
  if (variant === 'recommended') return <span className="badge badge-recommended">★ rec</span>
  return <span className="badge badge-no-meta">no metadata</span>
}
