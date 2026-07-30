import { useState } from 'react'
import type { Role } from './types'
import { LoginScreen } from './LoginScreen'
import { ChargeScreen } from './ChargeScreen'
import { PatientForm, PatientsTab } from './PatientForm'
import { CatalogPanel } from './CatalogPanel'
import { PeoplePanel } from './PeoplePanel'
import { ShiftScreen } from './ShiftScreen'
import { UsageStatsScreen } from './UsageStatsScreen'
import { ServicePicker } from './ServicePicker'
import { getCurrentService } from './store'
import { useAppState } from './useAppState'

type Screen =
  | { name: 'patients' }
  | { name: 'charge'; patientId: string }
  | { name: 'patient-form'; editId?: string }
  | { name: 'catalog' }
  | { name: 'people' }
  | { name: 'shift' }
  | { name: 'stats' }

type Tab = 'pacientes' | 'turno' | 'uso' | 'insumos' | 'personal'

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
    if (next === 'turno') setScreen({ name: 'shift' })
    if (next === 'uso') setScreen({ name: 'stats' })
    if (next === 'insumos') setScreen({ name: 'catalog' })
    if (next === 'personal') setScreen({ name: 'people' })
  }

  const inPatientFlow = screen.name === 'charge'

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-3 pb-8 pt-3 sm:px-6 sm:pt-4">
      <header className="flex items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <strong className="font-display text-xl font-extrabold tracking-tight text-white">
            Cargos paciente
          </strong>
          <span className="truncate text-sm text-white/70">
            Cargando desde <strong className="font-semibold text-white">{service.name}</strong>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin ? (
            <ServicePicker compact />
          ) : (
            <span className="rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white">
              {service.shortName}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            {isAdmin ? 'Admin' : 'Salir'}
          </button>
        </div>
      </header>

      {isAdmin && !inPatientFlow && screen.name !== 'patient-form' ? (
        <div className="grid grid-cols-5 gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
          <button
            type="button"
            onClick={() => goTab('pacientes')}
            className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${
              tab === 'pacientes'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pacientes
          </button>
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => goTab('turno')}
                className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'turno'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Turno
              </button>
              <button
                type="button"
                onClick={() => goTab('uso')}
                className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'uso'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Uso
              </button>
              <button
                type="button"
                onClick={() => goTab('insumos')}
                className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'insumos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Insumos
              </button>
              <button
                type="button"
                onClick={() => goTab('personal')}
                className={`min-h-11 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'personal'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Personal
              </button>
            </>
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
          onBack={() => goTab(tab)}
        />
      ) : null}

      {screen.name === 'patient-form' ? (
        <PatientForm editId={screen.editId} onDone={() => setScreen({ name: 'patients' })} />
      ) : null}

      {screen.name === 'shift' ? (
        <ShiftScreen onOpenPatient={(id) => setScreen({ name: 'charge', patientId: id })} />
      ) : null}

      {screen.name === 'stats' ? <UsageStatsScreen /> : null}

      {screen.name === 'catalog' ? <CatalogPanel /> : null}

      {screen.name === 'people' ? <PeoplePanel /> : null}
    </div>
  )
}
