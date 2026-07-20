import { useState } from 'react'
import type { Role } from './types'
import { LoginScreen } from './LoginScreen'
import { ChargeScreen } from './ChargeScreen'
import { PatientForm, PatientsTab } from './PatientForm'
import { CatalogPanel } from './CatalogPanel'
import { ServicePicker } from './ServicePicker'
import { getCurrentService } from './store'
import { useAppState } from './useAppState'

type Screen =
  | { name: 'patients' }
  | { name: 'charge'; patientId: string }
  | { name: 'patient-form'; editId?: string }
  | { name: 'catalog' }

type Tab = 'pacientes' | 'insumos'

export default function App() {
  useAppState()
  const service = getCurrentService()
  const [role, setRole] = useState<Role | null>(null)
  const [screen, setScreen] = useState<Screen>({ name: 'patients' })
  const [tab, setTab] = useState<Tab>('pacientes')

  if (!role) {
    return (
      <LoginScreen
        onEnter={(r) => {
          setRole(r)
          setScreen({ name: 'patients' })
          setTab('pacientes')
        }}
      />
    )
  }

  function logout() {
    setRole(null)
    setScreen({ name: 'patients' })
  }

  const isAdmin = role === 'admin'

  function goTab(next: Tab) {
    setTab(next)
    if (next === 'pacientes') setScreen({ name: 'patients' })
    if (next === 'insumos') setScreen({ name: 'catalog' })
  }

  const inPatientFlow = screen.name === 'charge'

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 bg-slate-50 px-4 pb-8 pt-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <strong className="font-display text-xl font-extrabold tracking-tight text-slate-900">
            Cargo Unidad
          </strong>
          <span className="truncate text-sm text-slate-500">
            Cargando desde <strong className="font-semibold text-slate-700">{service.name}</strong>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ServicePicker compact />
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            {isAdmin ? 'Admin' : 'Personal'}
          </button>
        </div>
      </header>

      {!inPatientFlow && screen.name !== 'patient-form' ? (
        <div
          className={`grid gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 ${
            isAdmin ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          <button
            type="button"
            onClick={() => goTab('pacientes')}
            className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${
              tab === 'pacientes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pacientes
          </button>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => goTab('insumos')}
              className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${
                tab === 'insumos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Insumos
            </button>
          ) : null}
        </div>
      ) : null}

      {screen.name === 'patients' ? (
        <PatientsTab
          admin={isAdmin}
          onSelect={(id) => setScreen({ name: 'charge', patientId: id })}
          onAdd={() => setScreen({ name: 'patient-form' })}
          onEdit={(id) => setScreen({ name: 'patient-form', editId: id })}
        />
      ) : null}

      {screen.name === 'charge' ? (
        <ChargeScreen
          patientId={screen.patientId}
          admin={isAdmin}
          onBack={() => setScreen({ name: 'patients' })}
        />
      ) : null}

      {screen.name === 'patient-form' ? (
        <PatientForm editId={screen.editId} onDone={() => setScreen({ name: 'patients' })} />
      ) : null}

      {screen.name === 'catalog' ? <CatalogPanel /> : null}
    </div>
  )
}
