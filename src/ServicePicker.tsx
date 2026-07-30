import { getCurrentService, setCurrentService } from './store'
import { useAppState } from './useAppState'

type Props = {
  /** Compacto para el header; completo para el login. */
  compact?: boolean
}

export function ServicePicker({ compact }: Props) {
  const { services, settings } = useAppState()
  const current = getCurrentService()

  if (compact) {
    return (
      <label className="flex items-center gap-2">
        <span className="sr-only">Servicio</span>
        <select
          value={settings.currentServiceId}
          onChange={(e) => setCurrentService(e.target.value)}
          className="min-h-9 max-w-[9.5rem] truncate rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          aria-label="Servicio desde el que se carga"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-1 text-sm font-medium text-slate-900">¿Desde qué servicio se carga?</p>
      <p className="mb-3 text-xs text-slate-500">
        Los cobros se asocian a este servicio (UPC, Urgencia, Pabellón, MQ…).
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {services.map((s) => {
          const active = s.id === current.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentService(s.id)}
              className={`min-h-12 rounded-xl border px-3 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand-tint ring-1 ring-brand/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <strong className="block text-sm font-semibold text-slate-900">{s.shortName}</strong>
              <span className="text-xs text-slate-500">{s.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
