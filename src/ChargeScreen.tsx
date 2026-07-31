import { useMemo, useState } from 'react'
import {
  addSupply,
  confirmChargeBatch,
  getActivePeople,
  getActiveSupplies,
  getCurrentService,
  getPatient,
  getPatientHistory,
  getPatientTotals,
  getPendingTotalsByService,
  markPatientHistoryTransferred,
  voidChargeBatch,
} from './store'
import { useAppState } from './useAppState'
import { ConfirmDialog } from './ConfirmDialog'
import type { ChargeLine } from './types'

type Props = {
  patientId: string
  onBack: () => void
  admin?: boolean
}

type View = 'cargar' | 'historial'
type Mode = 'charge' | 'return'

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

export function ChargeScreen({ patientId, onBack, admin }: Props) {
  useAppState()
  const patient = getPatient(patientId)
  const service = getCurrentService()
  const [view, setView] = useState<View>(admin ? 'historial' : 'cargar')
  const [mode, setMode] = useState<Mode>('charge')
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [personId, setPersonId] = useState('')
  const [query, setQuery] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [annulId, setAnnulId] = useState<string | null>(null)
  const [addSupplyOpen, setAddSupplyOpen] = useState(false)
  const [newSupplyName, setNewSupplyName] = useState('')
  const [toast, setToast] = useState('')

  const supplies = getActiveSupplies()
  const people = getActivePeople()
  const history = getPatientHistory(patientId)
  const totals = getPatientTotals(patientId)
  /** Saldo por insumo cargado al paciente (lo que se puede devolver). */
  const availableToReturn = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of totals) map.set(t.supplyId, t.quantity)
    return map
  }, [totals])
  const baseList =
    mode === 'return' ? supplies.filter((s) => (availableToReturn.get(s.id) ?? 0) > 0) : supplies
  const list = baseList.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
  const pendingByService = getPendingTotalsByService(patientId)
  const pendingCount = pendingByService.reduce(
    (sum, g) => sum + g.lines.reduce((s, l) => s + l.quantity, 0),
    0,
  )

  const draftLines: ChargeLine[] = useMemo(() => {
    return Object.entries(draft)
      .filter(([, q]) => q > 0)
      .map(([supplyId, quantity]) => {
        const supply = supplies.find((s) => s.id === supplyId)
        return {
          supplyId,
          supplyName: supply?.name ?? 'Insumo',
          quantity,
        }
      })
      .sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es'))
  }, [draft, supplies])

  const draftTotal = draftLines.reduce((sum, l) => sum + l.quantity, 0)

  if (!patient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-slate-500">Paciente no encontrado.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 min-h-11 rounded-xl border border-slate-200 px-4 font-medium text-slate-500 hover:bg-slate-50"
        >
          Volver
        </button>
      </div>
    )
  }

  function bump(supplyId: string, delta: number) {
    setDraft((prev) => {
      const next = Math.max(0, (prev[supplyId] ?? 0) + delta)
      if (next === 0) {
        const rest = { ...prev }
        delete rest[supplyId]
        return rest
      }
      return { ...prev, [supplyId]: next }
    })
  }

  function openConfirm() {
    if (!draftLines.length) return
    setConfirmOpen(true)
  }

  function confirmLoad() {
    if (!personId) return
    const batch = confirmChargeBatch(patientId, draft, mode, personId)
    if (!batch) return
    setDraft({})
    setPersonId('')
    setConfirmOpen(false)
    setToast(mode === 'return' ? 'Devolución registrada' : 'Insumos cargados al historial')
    setView('historial')
    setTimeout(() => setToast(''), 2200)
  }

  function confirmAnnul() {
    if (!annulId) return
    voidChargeBatch(annulId)
    setAnnulId(null)
    setToast('Carga anulada')
    setTimeout(() => setToast(''), 2200)
  }

  function submitNewSupply() {
    const name = newSupplyName.trim()
    if (!name) return
    addSupply(name, [service.id])
    setNewSupplyName('')
    setAddSupplyOpen(false)
    setToast(`"${name}" agregado al catálogo`)
    setTimeout(() => setToast(''), 2200)
  }

  function copyPendingText() {
    const blocks = pendingByService.map((g) =>
      [`Servicio: ${g.serviceName}`, ...g.lines.map((l) => `  ${l.supplyName}  × ${l.quantity}`)].join(
        '\n',
      ),
    )
    const text = [
      `Cama ${patient!.bed} · Adm. ${patient!.admissionNumber}`,
      '---',
      ...blocks,
    ].join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setToast('Copiado. Pégalo en el sistema de la clínica.')
      setTimeout(() => setToast(''), 2200)
    })
  }

  function confirmTransfer() {
    if (!pendingCount) return
    markPatientHistoryTransferred(patientId)
    setTransferOpen(false)
    setToast('Pasado al sistema de la clínica')
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a pacientes"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Cama {patient.bed}
            </span>
            <span className="text-sm text-slate-500">Adm. {patient.admissionNumber}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-xs font-semibold text-brand">
              {service.shortName}
            </span>
          </div>
        </div>
        {admin ? (
          <button
            type="button"
            onClick={() => setTransferOpen(true)}
            className="min-h-11 w-full rounded-xl bg-accent px-4 font-medium text-brand transition-colors hover:bg-accent-dark"
          >
            Pasar al sistema{pendingCount ? ` · ${pendingCount}` : ''}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
        <button
          type="button"
          onClick={() => setView('historial')}
          className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${
            view === 'historial'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Historial{history.length ? ` · ${history.length}` : ''}
        </button>
        <button
          type="button"
          onClick={() => setView('cargar')}
          className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${
            view === 'cargar'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Cargar
        </button>
      </div>

      {view === 'cargar' ? (
        <>
          {admin ? (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              Uso excepcional: carga aquí solo si necesitas cerrar al paciente y confirmaste con el
              enfermero/TENS qué insumos usó.
            </p>
          ) : null}

          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Acción
            </span>
            <div className="inline-flex gap-1 rounded-full bg-slate-100/70 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('charge')
                  setDraft({})
                }}
                className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  mode === 'charge'
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sacar / usar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('return')
                  setDraft({})
                }}
                className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                  mode === 'return'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Devolver
              </button>
            </div>
          </div>

          {mode === 'return' ? (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              Registra lo que sacaste pero <strong>no</strong> usaste. Se resta del total del
              paciente para que no se cobre de más.
            </p>
          ) : null}

          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar insumo…"
            autoComplete="off"
            aria-label="Buscar insumo"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
          />

          {list.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              {mode === 'return' && baseList.length === 0
                ? 'Este paciente no tiene insumos cargados que se puedan devolver.'
                : 'No hay insumos con ese nombre.'}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {list.map((s, i) => {
                const qty = draft[s.id] ?? 0
                const available = availableToReturn.get(s.id) ?? 0
                const atMax = mode === 'return' && qty >= available
                return (
                  <div
                    key={s.id}
                    className={`flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 ${
                      i !== 0 ? 'border-t border-slate-100' : ''
                    } ${qty ? (mode === 'return' ? 'bg-amber-50' : 'bg-brand-tint/60') : ''}`}
                  >
                    <span className="text-[0.95rem] font-medium text-slate-800">
                      {s.name}
                      {mode === 'return' ? (
                        <span className="ml-2 text-[0.7rem] font-semibold uppercase tracking-wide text-amber-700">
                          {available} cargado{available === 1 ? '' : 's'}
                        </span>
                      ) : s.favorite ? (
                        <span className="ml-2 text-[0.7rem] font-semibold uppercase tracking-wide text-brand/70">
                          frecuente
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
                      <button
                        type="button"
                        disabled={qty === 0}
                        onClick={() => bump(s.id, -1)}
                        aria-label={`Restar ${s.name}`}
                        className="grid h-10 w-10 place-items-center rounded-full text-lg font-medium text-slate-600 transition-colors hover:bg-white disabled:opacity-30"
                      >
                        −
                      </button>
                      <span
                        className={`min-w-7 text-center font-display text-base font-bold tabular-nums ${
                          qty === 0 ? 'text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {qty}
                      </span>
                      <button
                        type="button"
                        disabled={atMax}
                        onClick={() => bump(s.id, 1)}
                        aria-label={`Sumar ${s.name}`}
                        className={`grid h-10 w-10 place-items-center rounded-full text-lg font-medium transition-colors disabled:opacity-30 ${
                          mode === 'return'
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-accent text-brand hover:bg-accent-dark'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {mode === 'charge' ? (
            <button
              type="button"
              onClick={() => setAddSupplyOpen(true)}
              className="min-h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-500 transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand"
            >
              + Agregar insumo al catálogo de {service.shortName}
            </button>
          ) : null}

          <div className="pt-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <button
              type="button"
              disabled={!draftTotal}
              onClick={openConfirm}
              className={`min-h-13 w-full rounded-xl font-semibold shadow-lg transition-colors disabled:opacity-40 disabled:shadow-none ${
                mode === 'return'
                  ? 'bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-700'
                  : 'bg-accent text-brand shadow-slate-900/10 hover:bg-accent-dark'
              }`}
            >
              {mode === 'return'
                ? draftTotal
                  ? `Registrar devolución · ${draftTotal}`
                  : 'Registrar devolución'
                : draftTotal
                  ? `Cargar insumos · ${draftTotal}`
                  : 'Cargar insumos'}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Total acumulado</h2>
            <p className="mt-1 text-sm text-slate-500">
              Se va sumando a medida que el personal carga. Base para un cobro preciso.
            </p>
            {totals.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Sin cargas todavía.</div>
            ) : (
              <div className="mt-3">
                {totals.map((l) => (
                  <div
                    key={l.supplyId}
                    className="flex justify-between gap-3 border-t border-slate-100 py-2.5 first:border-t-0"
                  >
                    <span className="text-slate-600">{l.supplyName}</span>
                    <strong className="font-semibold text-slate-900">× {l.quantity}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Cargas a medida que llegan</h2>
            {history.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Todavía no hay cargas confirmadas.
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {history.map((batch) => {
                  const isReturn = batch.kind === 'return'
                  const canAnnul = !batch.transferred && !batch.voided
                  return (
                    <div
                      key={batch.id}
                      className={`rounded-xl p-3 ${
                        batch.voided
                          ? 'bg-slate-50 opacity-60'
                          : isReturn
                            ? 'bg-amber-50/60'
                            : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-semibold text-slate-700">
                            {formatWhen(batch.createdAt)}
                          </strong>
                          {isReturn ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              Devolución
                            </span>
                          ) : null}
                          {batch.voided ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">
                              Anulada
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {batch.serviceName}
                          </span>
                          {!batch.voided ? (
                            <span
                              className={`text-xs font-medium ${
                                batch.transferred ? 'text-ok' : 'text-slate-400'
                              }`}
                            >
                              {batch.transferred ? 'Pasado' : 'Pendiente'}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {batch.chargedByName ? (
                        <p className="mt-0.5 text-xs text-slate-500">por {batch.chargedByName}</p>
                      ) : null}
                      {batch.lines.map((l) => (
                        <div
                          key={`${batch.id}-${l.supplyId}`}
                          className="flex justify-between gap-3 py-1"
                        >
                          <span
                            className={`text-sm text-slate-600 ${batch.voided ? 'line-through' : ''}`}
                          >
                            {l.supplyName}
                          </span>
                          <strong
                            className={`text-sm font-medium ${
                              batch.voided
                                ? 'text-slate-400 line-through'
                                : isReturn
                                  ? 'text-amber-700'
                                  : 'text-slate-900'
                            }`}
                          >
                            {isReturn ? '−' : '×'} {l.quantity}
                          </strong>
                        </div>
                      ))}
                      {canAnnul ? (
                        <button
                          type="button"
                          onClick={() => setAnnulId(batch.id)}
                          className="mt-1 text-xs font-medium text-bad transition-colors hover:text-[#b02a37]"
                        >
                          Anular esta {isReturn ? 'devolución' : 'carga'}
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmOpen ? (
        <div
          role="presentation"
          onClick={() => setConfirmOpen(false)}
          className="fixed inset-0 z-40 grid place-items-end justify-center bg-slate-900/40 p-4 sm:place-items-center"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">
              {mode === 'return' ? '¿Confirmar devolución?' : '¿Confirmar carga?'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Servicio <strong className="font-semibold text-slate-700">{service.name}</strong>.{' '}
              {mode === 'return'
                ? 'Se resta del total del paciente y queda registrado en el historial.'
                : 'Al confirmar, queda en el historial del paciente.'}
            </p>
            <div className="mt-3 max-h-48 overflow-auto">
              {draftLines.map((l) => (
                <div
                  key={l.supplyId}
                  className="flex justify-between gap-3 border-t border-slate-100 py-2.5 first:border-t-0"
                >
                  <span className="text-slate-600">{l.supplyName}</span>
                  <strong className="font-semibold text-slate-900">× {l.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                ¿Quién {mode === 'return' ? 'devuelve' : 'saca'} los insumos?
              </p>
              {people.length === 0 ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No hay personal cargado para esta unidad. Pide al admin que lo agregue en la
                  pestaña <strong>Personal</strong>.
                </p>
              ) : (
                <div className="flex max-h-40 flex-wrap gap-2 overflow-auto">
                  {people.map((p) => {
                    const selected = p.id === personId
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPersonId(p.id)}
                        className={`min-h-11 rounded-xl border px-3 text-left transition-colors ${
                          selected
                            ? 'border-brand bg-brand-tint ring-1 ring-brand/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-slate-900">{p.name}</span>
                        {p.role ? (
                          <span className="block text-xs text-slate-500">{p.role}</span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="min-h-12 flex-1 rounded-xl border border-slate-200 font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Volver a editar
              </button>
              <button
                type="button"
                onClick={confirmLoad}
                disabled={!personId}
                className={`min-h-12 flex-1 rounded-xl font-medium shadow-sm transition-colors disabled:opacity-40 disabled:shadow-none ${
                  mode === 'return'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-accent text-brand hover:bg-accent-dark'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {transferOpen ? (
        <div
          role="presentation"
          onClick={() => setTransferOpen(false)}
          className="fixed inset-0 z-40 grid place-items-end justify-center bg-slate-900/40 p-4 sm:place-items-center"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <h2 id="transfer-title" className="text-lg font-semibold text-slate-900">
              Pasar al sistema de la clínica
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Cama {patient.bed} · Adm. {patient.admissionNumber}. Detalle agrupado por servicio.
            </p>

            <div className="mt-3 max-h-72 overflow-auto">
              {pendingByService.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  No hay cargos pendientes. Todo ya fue pasado.
                </div>
              ) : (
                pendingByService.map((g) => (
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
                ))
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTransferOpen(false)}
                className="min-h-12 flex-1 rounded-xl border border-slate-200 font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={!pendingCount}
                onClick={copyPendingText}
                className="min-h-12 flex-1 rounded-xl bg-slate-100 font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40"
              >
                Copiar
              </button>
              <button
                type="button"
                disabled={!pendingCount}
                onClick={confirmTransfer}
                className="min-h-12 flex-1 rounded-xl bg-accent font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-40 disabled:shadow-none"
              >
                Confirmar y pasar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={annulId !== null}
        title="¿Anular este registro?"
        message="Deja de contar para el cobro, pero queda en el historial marcado como anulado."
        confirmLabel="Anular"
        tone="danger"
        onConfirm={confirmAnnul}
        onCancel={() => setAnnulId(null)}
      />

      {addSupplyOpen ? (
        <div
          role="presentation"
          onClick={() => setAddSupplyOpen(false)}
          className="fixed inset-0 z-50 grid place-items-end justify-center bg-slate-900/40 p-4 sm:place-items-center"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-supply-title"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            <h2 id="add-supply-title" className="text-lg font-semibold text-slate-900">
              Agregar insumo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aparece en el catálogo de <strong className="font-semibold text-brand">{service.name}</strong>
              . Uso pensado para la versión de prueba, para no interrumpir un registro si falta algo.
            </p>
            <input
              autoFocus
              value={newSupplyName}
              onChange={(e) => setNewSupplyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewSupply()
              }}
              placeholder="Ej. Bránula 24"
              autoComplete="off"
              aria-label="Nombre del insumo"
              className="mt-4 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddSupplyOpen(false)
                  setNewSupplyName('')
                }}
                className="min-h-12 flex-1 rounded-xl border border-slate-200 font-medium text-slate-500 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newSupplyName.trim()}
                onClick={submitNewSupply}
                className="min-h-12 flex-1 rounded-xl bg-accent font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark disabled:opacity-40 disabled:shadow-none"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="animate-toast fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  )
}
