type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  /** 'danger' para acciones destructivas (rojo), 'primary' para acciones de avance (lima). */
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo de confirmación con la marca, en reemplazo del confirm() nativo. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 grid place-items-end justify-center bg-slate-900/40 p-4 sm:place-items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 flex-1 rounded-xl border border-slate-200 font-medium text-slate-500 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-12 flex-1 rounded-xl font-medium shadow-sm transition-colors ${
              tone === 'danger'
                ? 'bg-bad text-white hover:bg-[#b02a37]'
                : 'bg-accent text-brand hover:bg-accent-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
