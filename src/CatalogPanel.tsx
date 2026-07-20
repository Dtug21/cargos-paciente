import { useState, type FormEvent } from 'react'
import { addSupply, updateSupply } from './store'
import { useAppState } from './useAppState'

export function CatalogPanel() {
  const { supplies } = useAppState()
  const [name, setName] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addSupply(name)
    setName('')
  }

  const list = [...supplies].sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Catálogo de insumos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Stock compartido. El servicio (UPC, Urgencia, etc.) se elige al cargar, no acá.
        </p>

        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="supply" className="text-sm font-medium text-slate-500">
              Nuevo insumo
            </label>
            <input
              id="supply"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Catéter periférico"
              autoComplete="off"
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-teal-700 px-5 font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            Agregar
          </button>
        </form>

        <div className="mt-3">
          {list.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <strong
                  className={`truncate font-medium ${s.active ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  {s.name}
                </strong>
                <span className="text-xs text-slate-400">
                  {s.active ? (s.favorite ? 'Frecuente' : 'Activo') : 'Oculto'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSupply(s.id, { favorite: !s.favorite })}
                  disabled={!s.active}
                  className="min-h-10 min-w-10 rounded-lg bg-slate-100 text-base text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40"
                >
                  {s.favorite ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  onClick={() => updateSupply(s.id, { active: !s.active })}
                  className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                >
                  {s.active ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
