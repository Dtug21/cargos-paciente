import { useState } from 'react'
import { getCurrentService, getUsageStats } from './store'
import { useAppState } from './useAppState'

type Range = 7 | 30 | 0 // 0 = todo el histórico

const rangeLabels: Record<Range, string> = {
  7: 'Últimos 7 días',
  30: 'Últimos 30 días',
  0: 'Todo el histórico',
}

/**
 * Vista de uso agregado por insumo — evidencia para diseñar carritos de enfermería
 * y ajustar el stock de la unidad. NO es control individual por persona.
 */
export function UsageStatsScreen() {
  useAppState()
  const service = getCurrentService()
  const [range, setRange] = useState<Range>(30)
  const stats = getUsageStats({
    serviceId: service.id,
    sinceDays: range === 0 ? undefined : range,
  })

  const max = stats.lines[0]?.quantity ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Uso de insumos en {service.name}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranking del consumo real (cargas menos devoluciones). Sirve para decidir qué llevar en
          los carritos de enfermería y ajustar el stock. No mide desempeño individual.
        </p>
        <div className="mt-3 inline-flex gap-1 rounded-full bg-slate-100/70 p-0.5">
          {([7, 30, 0] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                range === r
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {rangeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {stats.lines.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Sin datos en este rango. Cuando el personal registre cargas, aparecerán aquí.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <span className="text-sm text-slate-500">
              {stats.lines.length} insumo{stats.lines.length > 1 ? 's' : ''} distintos
            </span>
            <span className="font-display text-2xl font-bold text-brand tabular-nums">
              {stats.totalUnits.toLocaleString('es-CL')}
              <span className="ml-1 text-sm font-medium text-slate-500">unidades</span>
            </span>
          </div>
          <ol className="flex flex-col gap-3">
            {stats.lines.map((l, i) => {
              const pct = max > 0 ? (l.quantity / max) * 100 : 0
              const share = stats.totalUnits > 0 ? (l.quantity / stats.totalUnits) * 100 : 0
              return (
                <li key={l.supplyId} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-slate-800">
                      <span className="mr-2 inline-block min-w-5 text-right font-display font-bold text-slate-400 tabular-nums">
                        {i + 1}
                      </span>
                      {l.supplyName}
                    </span>
                    <span className="shrink-0 text-sm">
                      <strong className="font-semibold text-slate-900 tabular-nums">
                        {l.quantity}
                      </strong>
                      <span className="ml-1 text-xs text-slate-500 tabular-nums">
                        · {share.toFixed(0)}%
                      </span>
                    </span>
                  </div>
                  <div className="ml-7 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-5 rounded-xl bg-brand-tint px-3 py-2 text-xs text-brand">
            <strong>Idea:</strong> los insumos en el top del ranking son candidatos naturales para
            un carrito de enfermería estándar en {service.name}.
          </p>
        </div>
      )}
    </div>
  )
}
