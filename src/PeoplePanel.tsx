import { useState, type FormEvent } from 'react'
import { addPerson, getAllPeople, togglePersonService, updatePerson } from './store'
import { useAppState } from './useAppState'

export function PeoplePanel() {
  const { services } = useAppState()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  const list = getAllPeople()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addPerson({ name, role, serviceIds: [] })
    setName('')
    setRole('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Personal</h2>
        <p className="mt-1 text-sm text-slate-500">
          Quiénes pueden figurar como responsables de una carga. Marca en qué unidades trabaja cada
          uno; la tablet de cada unidad muestra solo a los suyos. Sin marcas = aparece en todas.
        </p>

        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label htmlFor="person-name" className="text-sm font-medium text-slate-500">
              Nombre
            </label>
            <input
              id="person-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Camila Rojas"
              autoComplete="off"
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div className="flex w-40 flex-col gap-1.5">
            <label htmlFor="person-role" className="text-sm font-medium text-slate-500">
              Cargo
            </label>
            <input
              id="person-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enfermera, TENS…"
              autoComplete="off"
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 outline-none transition-shadow focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-accent px-5 font-medium text-brand shadow-sm transition-colors hover:bg-accent-dark"
          >
            Agregar
          </button>
        </form>

        <div className="mt-3">
          {list.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Sin personal cargado. Agrega al primero.
            </div>
          ) : (
            list.map((p) => (
              <div key={p.id} className="border-t border-slate-100 py-3 first:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <strong
                      className={`truncate font-medium ${p.active ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {p.name}
                    </strong>
                    <span className="text-xs text-slate-400">
                      {p.role || 'Sin cargo'}
                      {p.active ? '' : ' · Oculto'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePerson(p.id, { active: !p.active })}
                    className="min-h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                  >
                    {p.active ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-medium text-slate-400">Trabaja en:</span>
                  {services.map((svc) => {
                    const on = p.serviceIds.length === 0 || p.serviceIds.includes(svc.id)
                    const all = p.serviceIds.length === 0
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => togglePersonService(p.id, svc.id)}
                        className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
                          on
                            ? all
                              ? 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                              : 'bg-brand text-white'
                            : 'bg-white text-slate-400 ring-1 ring-slate-200 hover:ring-slate-300'
                        }`}
                        title={all ? 'Aparece en todas las unidades' : svc.name}
                      >
                        {svc.shortName}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
