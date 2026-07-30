import { useState } from 'react'
import {
  getPendingBatches,
  getPendingSummary,
  markPatientHistoryTransferred,
  startOfToday,
} from './store'
import { useAppState } from './useAppState'
import { ConfirmDialog } from './ConfirmDialog'

type Range = 'today' | 'all'

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Vista de turno del admin: todos los pacientes con cargos pendientes, para pasar de una. */
export function ShiftScreen({ onOpenPatient }: { onOpenPatient: (id: string) => void }) {
  useAppState()
  const [range, setRange] = useState<Range>('today')
  const since = range === 'today' ? startOfToday() : undefined
  const summary = getPendingSummary(since)
  const [toast, setToast] = useState('')
  const [passTarget, setPassTarget] = useState<{ id: string; bed: string } | null>(null)

  const totalPending = summary.reduce((sum, row) => sum + row.pendingCount, 0)

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  function patientText(row: (typeof summary)[number]) {
    const blocks = row.byService.map((g) =>
      [`Servicio: ${g.serviceName}`, ...g.lines.map((l) => `  ${l.supplyName}  × ${l.quantity}`)].join(
        '\n',
      ),
    )
    return [`Cama ${row.patient.bed} · Adm. ${row.patient.admissionNumber}`, ...blocks].join('\n')
  }

  function copyAll() {
    const text = summary.map(patientText).join('\n\n———\n\n')
    navigator.clipboard.writeText(text).then(() => flash('Copiado. Pégalo en el sistema.'))
  }

  function confirmPass() {
    if (!passTarget) return
    markPatientHistoryTransferred(passTarget.id)
    setPassTarget(null)
    flash('Marcado como pasado al sistema')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Pendientes del turno</h2>
            <p className="mt-1 text-sm text-slate-500">
              {summary.length
                ? `${summary.length} paciente${summary.length > 1 ? 's' : ''} · ${totalPending} insumo${totalPending > 1 ? 's' : ''} sin pasar · ${range === 'today' ? 'hoy' : 'todo pendiente'}`
                : range === 'today'
                  ? 'Sin cargas hoy.'
                  : 'Todo pasado al sistema.'}
            </p>
          </div>
          {summary.length ? (
            <button
              type="button"
              onClick={copyAll}
              className="min-h-11 rounded-xl bg-slate-100 px-4 font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              Copiar todo
            </button>
          ) : null}
        </div>
        <div className="mt-3 inline-flex gap-1 rounded-full bg-slate-100/70 p-0.5">
          <button
            type="button"
            onClick={() => setRange('today')}
            className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
              range === 'today'
                ? 'bg-white text-brand shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setRange('all')}
            className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
              range === 'all'
                ? 'bg-white text-brand shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Todo pendiente
          </button>
        </div>
      </div>

      {summary.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          {range === 'today'
            ? 'Sin cargas del día. Cambia a "Todo pendiente" si buscas algo de días anteriores.'
            : 'No hay cargos pendientes. Cuando el personal cargue insumos, van a aparecer aquí.'}
        </div>
      ) : (
        summary.map((row) => {
          const batches = getPendingBatches(row.patient.id, since)
          return (
            <div key={row.patient.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={() => onOpenPatient(row.patient.id)}
                  className="text-left"
                >
                  <span className="font-display text-xl font-bold tracking-tight text-slate-900 hover:text-brand">
                    Cama {row.patient.bed}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">
                    Adm. {row.patient.admissionNumber}
                  </span>
                </button>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {row.pendingCount} sin pasar
                </span>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total a pasar
                </p>
                {row.byService.map((g) => (
                  <div key={g.serviceId} className="mb-3 last:mb-0">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
                      {g.serviceName}
                    </p>
                    {g.lines.map((l) => (
                      <div
                        key={`${g.serviceId}-${l.supplyId}`}
                        className="flex justify-between gap-3 border-t border-slate-100 py-2 first:border-t-0"
                      >
                        <span className="text-slate-600">{l.supplyName}</span>
                        <strong className="font-semibold text-slate-900">× {l.quantity}</strong>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Quién cargó
                </p>
                <div className="flex flex-col gap-2">
                  {batches.map((b) => {
                    const isReturn = b.kind === 'return'
                    return (
                      <div key={b.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <strong className="font-semibold text-slate-700">
                            {b.chargedByName ?? 'Sin responsable'}
                          </strong>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {b.serviceName}
                          </span>
                          {isReturn ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              Devolución
                            </span>
                          ) : null}
                          <span className="text-xs text-slate-400">{formatWhen(b.createdAt)}</span>
                        </div>
                        <p className="text-slate-500">
                          {b.lines
                            .map((l) => `${l.supplyName} ${isReturn ? '−' : '×'}${l.quantity}`)
                            .join(' · ')}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPassTarget({ id: row.patient.id, bed: row.patient.bed })}
                className="mt-4 min-h-12 w-full rounded-xl bg-accent font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark"
              >
                Pasar al sistema
              </button>
            </div>
          )
        })
      )}

      <ConfirmDialog
        open={passTarget !== null}
        title={`¿Pasar la cama ${passTarget?.bed ?? ''} al sistema?`}
        message="Confirma que ya ingresaste este detalle en el sistema de la clínica. Las cargas quedan marcadas como pasadas."
        confirmLabel="Sí, ya lo pasé"
        onConfirm={confirmPass}
        onCancel={() => setPassTarget(null)}
      />

      {toast ? (
        <div className="animate-toast fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
