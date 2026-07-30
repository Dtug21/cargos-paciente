import { useState, type FormEvent } from 'react'
import {
  addPatient,
  closePatient,
  getActivePatients,
  getPatient,
  getPendingQuantity,
  updatePatient,
} from './store'
import { useAppState } from './useAppState'
import { ConfirmDialog } from './ConfirmDialog'

type Props = {
  onDone: () => void
  editId?: string
}

export function PatientForm({ onDone, editId }: Props) {
  const existing = editId ? getPatient(editId) : undefined
  const [admissionNumber, setAdmissionNumber] = useState(existing?.admissionNumber ?? '')
  const [bed, setBed] = useState(existing?.bed ?? '')
  const [closeOpen, setCloseOpen] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!admissionNumber.trim() || !bed.trim()) return
    if (editId) {
      updatePatient(editId, {
        admissionNumber: admissionNumber.trim(),
        bed: bed.trim(),
      })
    } else {
      addPatient({ admissionNumber, bed })
    }
    onDone()
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {editId ? 'Editar paciente' : 'Agregar paciente'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Solo <span className="font-medium text-slate-700">N° de admisión</span> y{' '}
          <span className="font-medium text-slate-700">cama</span>, iguales al sistema de la
          clínica.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bed" className="text-sm font-medium text-slate-500">
          Cama
        </label>
        <input
          id="bed"
          value={bed}
          onChange={(e) => setBed(e.target.value)}
          required
          autoComplete="off"
          placeholder="Ej. 101"
          autoFocus
          className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="adm" className="text-sm font-medium text-slate-500">
          N° de admisión
        </label>
        <input
          id="adm"
          value={admissionNumber}
          onChange={(e) => setAdmissionNumber(e.target.value)}
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej. 4521"
          className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="min-h-12 flex-1 rounded-xl border border-slate-200 font-medium text-slate-500 transition-colors hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="min-h-12 flex-1 rounded-xl bg-accent font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark"
        >
          {editId ? 'Guardar' : 'Agregar'}
        </button>
      </div>

      {editId ? (
        <button
          type="button"
          onClick={() => setCloseOpen(true)}
          className="min-h-12 w-full rounded-xl bg-red-50 font-medium text-bad transition-colors hover:bg-red-100"
        >
          Cerrar paciente (egreso)
        </button>
      ) : null}

      <ConfirmDialog
        open={closeOpen}
        title="¿Cerrar este paciente?"
        message="Se quita de la lista de la unidad por egreso. Su historial de cargas se conserva."
        confirmLabel="Cerrar paciente"
        tone="danger"
        onConfirm={() => {
          if (editId) closePatient(editId)
          setCloseOpen(false)
          onDone()
        }}
        onCancel={() => setCloseOpen(false)}
      />
    </form>
  )
}

/** Lista + alta rápida (pestaña Pacientes). */
export function PatientsTab({
  onSelect,
  onAdd,
  onEdit,
  admin,
}: {
  onSelect: (id: string) => void
  onAdd: () => void
  onEdit: (id: string) => void
  admin?: boolean
}) {
  useAppState()
  const active = getActivePatients()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Pacientes</h2>
        <button
          type="button"
          onClick={onAdd}
          className="min-h-11 rounded-xl bg-accent px-4 font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark"
        >
          + Agregar
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {admin
          ? 'Toca un paciente para ver lo que le fueron cargando y pasarlo al sistema.'
          : 'Toca la cama del paciente para cargar sus insumos.'}
      </p>

      {active.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          Lista vacía. Agrega el primer paciente.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {active.map((p) => {
            const pending = admin ? getPendingQuantity(p.id) : 0
            return (
              <div key={p.id} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className="flex flex-1 min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/60"
                >
                  <span className="flex min-w-12 items-center justify-center rounded-lg bg-white px-2 py-1.5 font-display text-lg font-bold text-slate-700 ring-1 ring-slate-200">
                    {p.bed}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="truncate text-[0.95rem] font-semibold text-slate-900">
                      Cama {p.bed}
                    </strong>
                    <span className="text-sm text-slate-500">Adm. {p.admissionNumber}</span>
                  </span>
                  {pending > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {pending} sin pasar
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(p.id)}
                  className="min-h-14 min-w-[64px] rounded-xl border border-slate-200 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                >
                  Editar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
