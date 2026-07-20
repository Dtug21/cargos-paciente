import { useEffect, useState } from 'react'
import type { Role } from './types'
import { getCurrentService, loadDemoData, setCurrentService, verifyPin } from './store'
import { useAppState } from './useAppState'

type Props = {
  onEnter: (role: Role) => void
}

type Step = 'pin' | 'service'

export function LoginScreen({ onEnter }: Props) {
  const { services } = useAppState()
  const [step, setStep] = useState<Step>('pin')
  const [role, setRole] = useState<Role>('staff')
  const [pendingRole, setPendingRole] = useState<Role | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [demoMsg, setDemoMsg] = useState('')

  useEffect(() => {
    setPin('')
    setError('')
  }, [role])

  function press(digit: string) {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError('')
    if (next.length === 4) {
      if (verifyPin(role, next)) {
        setPendingRole(role)
        setStep('service')
      } else {
        setError('PIN incorrecto')
        setTimeout(() => setPin(''), 350)
      }
    }
  }

  function backspace() {
    setPin((p) => p.slice(0, -1))
    setError('')
  }

  function chooseService(serviceId: string) {
    if (!pendingRole) return
    setCurrentService(serviceId)
    onEnter(pendingRole)
  }

  function resetDemo() {
    loadDemoData()
    setDemoMsg('Ejemplos listos: 4 pacientes con cargas')
    setTimeout(() => setDemoMsg(''), 2500)
  }

  function backToPin() {
    setStep('pin')
    setPendingRole(null)
    setPin('')
    setError('')
  }

  if (step === 'service') {
    const current = getCurrentService()
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-slate-50 px-6 py-10">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">
            {pendingRole === 'admin' ? 'Admin' : 'Personal'} autenticado
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            ¿Desde qué servicio?
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Los cobros se asocian a este servicio (UPC, Urgencia, Pabellón, MQ…).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {services.map((s) => {
            const active = s.id === current.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseService(s.id)}
                className={`min-h-16 rounded-2xl border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <strong className="block font-display text-base font-semibold text-slate-900">
                  {s.shortName}
                </strong>
                <span className="text-xs text-slate-500">{s.name}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={backToPin}
          className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
        >
          ← Volver al PIN
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 bg-slate-50 px-6 py-10">
      <div>
        <p className="mb-1 text-sm font-medium text-slate-500">
          Cargos fieles por admisión, cama y servicio
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cargo Unidad</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Ingresá el PIN y después elegí el servicio desde el que vas a cargar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole('staff')}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            role === 'staff'
              ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <strong className="block font-display text-base font-semibold text-slate-900">
            Personal
          </strong>
          <span className="text-sm text-slate-500">Pacientes, cargar insumos e historial</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('admin')}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            role === 'admin'
              ? 'border-teal-600 bg-teal-50/70 ring-1 ring-teal-600/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <strong className="block font-display text-base font-semibold text-slate-900">
            Admin
          </strong>
          <span className="text-sm text-slate-500">Catálogo y pasar al sistema</span>
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-center text-sm text-slate-500">
          Ingresá el PIN de {role === 'staff' ? 'personal' : 'admin'}
        </p>
        <div className="my-3 text-center font-display text-3xl font-semibold tracking-[0.35em] text-slate-900">
          {pin.padEnd(4, '·')}
        </div>
        {error ? <p className="mb-2 text-center text-sm font-medium text-rose-600">{error}</p> : null}
        <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="min-h-14 rounded-xl border border-slate-200 bg-white font-display text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            className="min-h-14 rounded-xl border border-slate-200 bg-white text-lg text-slate-400 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            className="col-span-2 min-h-14 rounded-xl border border-slate-200 bg-white font-display text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            0
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: personal <strong className="font-semibold text-slate-500">1234</strong> · admin{' '}
          <strong className="font-semibold text-slate-500">0000</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={resetDemo}
        className="min-h-11 rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 transition-colors hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800"
      >
        {demoMsg || 'Restablecer datos de ejemplo'}
      </button>
    </div>
  )
}
