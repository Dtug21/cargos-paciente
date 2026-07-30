import { useEffect, useState } from 'react'
import type { Role } from './types'
import { getCurrentService, loadDemoData, verifyPin } from './store'
import { useAppState } from './useAppState'
import { ServicePicker } from './ServicePicker'

type Props = {
  onEnter: (role: Role) => void
}

export function LoginScreen({ onEnter }: Props) {
  const { settings } = useAppState()
  const service = getCurrentService()
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [demoMsg, setDemoMsg] = useState('')

  useEffect(() => {
    if (!showPin) {
      setPin('')
      setError('')
    }
  }, [showPin])

  function press(digit: string) {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    setError('')
    if (next.length === 4) {
      if (verifyPin('admin', next)) {
        onEnter('admin')
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

  function resetDemo() {
    loadDemoData()
    setDemoMsg('Todo listo para empezar')
    setTimeout(() => setDemoMsg(''), 2500)
  }

  if (showPin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-500">Acceso administrativo</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ingresa el PIN</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Solo admin: pasar cargos al sistema y gestionar el personal.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="my-3 text-center font-display text-3xl font-semibold tracking-[0.35em] text-slate-900">
            {pin.padEnd(4, '·')}
          </div>
          {error ? (
            <p className="mb-2 text-center text-sm font-medium text-bad">{error}</p>
          ) : null}
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
            Demo: admin <strong className="font-semibold text-slate-500">0000</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPin(false)}
          className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
        >
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 bg-slate-50 px-6 py-10">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-brand">
          Cargos paciente
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {settings.clinicLabel}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onEnter('staff')}
        aria-label={`Empezar a cargar insumos en ${service.name}`}
        className="group flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl bg-brand px-6 py-10 text-center shadow-xl shadow-slate-900/20 transition-colors hover:bg-brand-dark"
      >
        <span className="text-sm font-medium uppercase tracking-wide text-white/60">
          Insumos de esta unidad
        </span>
        <span className="font-display text-5xl font-extrabold tracking-tight text-white">
          {service.name}
        </span>
        <span className="mt-2 rounded-full bg-accent px-5 py-2 font-display text-lg font-semibold text-brand">
          Toca para empezar
        </span>
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Unidad de esta tablet
            </p>
            <p className="text-sm text-slate-500">Se cambia solo al instalar el equipo</p>
          </div>
          <ServicePicker compact />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPin(true)}
          className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Soy admin
        </button>
        <button
          type="button"
          onClick={resetDemo}
          className="min-h-12 flex-1 rounded-xl border border-dashed border-slate-300 bg-white text-sm font-medium text-slate-600 transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand"
        >
          {demoMsg || 'Reiniciar demo'}
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        Un producto de <strong className="font-display font-semibold text-slate-500">Dito Labs SpA</strong>
      </p>
    </div>
  )
}
