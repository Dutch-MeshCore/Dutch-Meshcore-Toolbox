import type { ToastMsg } from '../../types'

export default function Toast({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null
  return (
    <div className="toast">
      {toasts.map(t => (
        <div key={t.id} className={`toast-msg ${t.type} show`}>{t.msg}</div>
      ))}
    </div>
  )
}
