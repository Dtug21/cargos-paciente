import type { AppState, ChargeBatch, ChargeLine, Patient, Role, Service, Supply } from './types'

const STORAGE_KEY = 'cargo-unidad-v6'

const defaultServices: Service[] = [
  { id: 'svc_upc', name: 'UPC', shortName: 'UPC' },
  { id: 'svc_urg', name: 'Urgencia', shortName: 'URG' },
  { id: 'svc_pab', name: 'Pabellón', shortName: 'PAB' },
  { id: 'svc_mq', name: 'Medicina Quirúrgica', shortName: 'MQ' },
  { id: 'svc_med', name: 'Medicina', shortName: 'MED' },
  { id: 'svc_uci', name: 'UCI', shortName: 'UCI' },
]

const defaultSupplies: Supply[] = [
  { id: 's1', name: 'Guantes de procedimiento', favorite: true, active: true },
  { id: 's2', name: 'Jeringa 5 ml', favorite: true, active: true },
  { id: 's3', name: 'Jeringa 10 ml', favorite: true, active: true },
  { id: 's4', name: 'Aguja 21G', favorite: false, active: true },
  { id: 's5', name: 'Suero fisiológico 100 ml', favorite: true, active: true },
  { id: 's6', name: 'Gasas estériles', favorite: true, active: true },
  { id: 's7', name: 'Apósito transparente', favorite: false, active: true },
  { id: 's8', name: 'Alcohol 70%', favorite: false, active: true },
  { id: 's9', name: 'Tórulas de algodón', favorite: false, active: true },
  { id: 's10', name: 'Equipo venoclisis', favorite: true, active: true },
]

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString()
}

function demoPatients(): Patient[] {
  return [
    {
      id: 'p_demo_101',
      admissionNumber: '4521',
      bed: '101',
      status: 'active',
      createdAt: hoursAgo(8),
    },
    {
      id: 'p_demo_102',
      admissionNumber: '4528',
      bed: '102',
      status: 'active',
      createdAt: hoursAgo(6),
    },
    {
      id: 'p_demo_105',
      admissionNumber: '4530',
      bed: '105',
      status: 'active',
      createdAt: hoursAgo(4),
    },
    {
      id: 'p_demo_108',
      admissionNumber: '4535',
      bed: '108',
      status: 'active',
      createdAt: hoursAgo(2),
    },
  ]
}

function demoHistory(): ChargeBatch[] {
  return [
    {
      id: 'h_demo_1',
      patientId: 'p_demo_101',
      serviceId: 'svc_upc',
      serviceName: 'UPC',
      createdAt: hoursAgo(7),
      transferred: false,
      lines: [
        { supplyId: 's1', supplyName: 'Guantes de procedimiento', quantity: 4 },
        { supplyId: 's2', supplyName: 'Jeringa 5 ml', quantity: 2 },
        { supplyId: 's6', supplyName: 'Gasas estériles', quantity: 3 },
      ],
    },
    {
      id: 'h_demo_2',
      patientId: 'p_demo_101',
      serviceId: 'svc_upc',
      serviceName: 'UPC',
      createdAt: hoursAgo(3),
      transferred: false,
      lines: [
        { supplyId: 's5', supplyName: 'Suero fisiológico 100 ml', quantity: 1 },
        { supplyId: 's10', supplyName: 'Equipo venoclisis', quantity: 1 },
        { supplyId: 's1', supplyName: 'Guantes de procedimiento', quantity: 2 },
      ],
    },
    {
      id: 'h_demo_3',
      patientId: 'p_demo_101',
      serviceId: 'svc_urg',
      serviceName: 'Urgencia',
      createdAt: hoursAgo(1),
      transferred: false,
      lines: [
        { supplyId: 's3', supplyName: 'Jeringa 10 ml', quantity: 1 },
        { supplyId: 's4', supplyName: 'Aguja 21G', quantity: 1 },
        { supplyId: 's8', supplyName: 'Alcohol 70%', quantity: 1 },
      ],
    },
    {
      id: 'h_demo_4',
      patientId: 'p_demo_102',
      serviceId: 'svc_mq',
      serviceName: 'Medicina Quirúrgica',
      createdAt: hoursAgo(5),
      transferred: false,
      lines: [
        { supplyId: 's1', supplyName: 'Guantes de procedimiento', quantity: 6 },
        { supplyId: 's6', supplyName: 'Gasas estériles', quantity: 4 },
        { supplyId: 's7', supplyName: 'Apósito transparente', quantity: 2 },
        { supplyId: 's9', supplyName: 'Tórulas de algodón', quantity: 5 },
      ],
    },
    {
      id: 'h_demo_5',
      patientId: 'p_demo_105',
      serviceId: 'svc_pab',
      serviceName: 'Pabellón',
      createdAt: hoursAgo(3.5),
      transferred: true,
      lines: [
        { supplyId: 's2', supplyName: 'Jeringa 5 ml', quantity: 3 },
        { supplyId: 's1', supplyName: 'Guantes de procedimiento', quantity: 2 },
      ],
    },
  ]
}

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function defaultState(): AppState {
  return {
    settings: {
      clinicLabel: 'Clínica Demo',
      currentServiceId: 'svc_upc',
      staffPin: '1234',
      adminPin: '0000',
    },
    services: defaultServices,
    patients: demoPatients(),
    supplies: defaultSupplies,
    history: demoHistory(),
  }
}

function normalizeState(raw: Record<string, unknown>): AppState {
  const base = defaultState()
  const settingsRaw = (raw.settings as Record<string, unknown> | undefined) ?? {}

  const clinicLabel =
    (typeof settingsRaw.clinicLabel === 'string' && settingsRaw.clinicLabel.trim()) ||
    base.settings.clinicLabel

  let services = Array.isArray(raw.services) ? (raw.services as Service[]) : []
  if (services.length === 0) services = defaultServices

  const currentServiceId =
    typeof settingsRaw.currentServiceId === 'string' &&
    services.some((s) => s.id === settingsRaw.currentServiceId)
      ? (settingsRaw.currentServiceId as string)
      : services[0]?.id ?? 'svc_upc'

  const patients: Patient[] = (Array.isArray(raw.patients) ? raw.patients : []).map((p) => {
    const row = p as Patient
    return {
      id: row.id,
      admissionNumber: row.admissionNumber,
      bed: row.bed,
      status: row.status === 'closed' ? ('closed' as const) : ('active' as const),
      createdAt: row.createdAt,
    }
  })

  let supplies = Array.isArray(raw.supplies) ? (raw.supplies as Supply[]) : []
  if (supplies.length === 0) {
    supplies = defaultSupplies
  } else {
    supplies = supplies.map((s) => ({
      id: s.id,
      name: s.name,
      favorite: Boolean(s.favorite),
      active: s.active !== false,
    }))
  }

  let history: ChargeBatch[] = Array.isArray(raw.history) ? (raw.history as ChargeBatch[]) : []
  const fallbackService = services[0]

  history = history.map((h) => ({
    ...h,
    serviceId: h.serviceId || fallbackService.id,
    serviceName: h.serviceName || fallbackService.name,
  }))

  if (!history.length && Array.isArray(raw.charges)) {
    const byPatient = new Map<string, ChargeLine[]>()
    for (const c of raw.charges as Array<{
      patientId: string
      supplyId: string
      quantity: number
    }>) {
      if (!c.quantity) continue
      const supply = supplies.find((s) => s.id === c.supplyId)
      const lines = byPatient.get(c.patientId) ?? []
      lines.push({
        supplyId: c.supplyId,
        supplyName: supply?.name ?? 'Insumo',
        quantity: c.quantity,
      })
      byPatient.set(c.patientId, lines)
    }
    history = [...byPatient.entries()].map(([patientId, lines]) => ({
      id: createId('h'),
      patientId,
      serviceId: fallbackService.id,
      serviceName: fallbackService.name,
      createdAt: new Date().toISOString(),
      lines,
      transferred: false,
    }))
  }

  return {
    settings: {
      clinicLabel,
      currentServiceId,
      staffPin:
        typeof settingsRaw.staffPin === 'string' ? settingsRaw.staffPin : base.settings.staffPin,
      adminPin:
        typeof settingsRaw.adminPin === 'string' ? settingsRaw.adminPin : base.settings.adminPin,
    },
    services,
    patients,
    supplies,
    history,
  }
}

function loadState(): AppState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem('cargo-unidad-v5') ??
      localStorage.getItem('cargo-unidad-v4') ??
      localStorage.getItem('cargo-unidad-v3')
    if (!raw) return defaultState()
    const normalized = normalizeState(JSON.parse(raw) as Record<string, unknown>)
    if (normalized.patients.length === 0) return defaultState()
    return normalized
  } catch {
    return defaultState()
  }
}

let state = loadState()
localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
const listeners = new Set<() => void>()

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState(): AppState {
  return state
}

export function getCurrentService(): Service {
  return (
    state.services.find((s) => s.id === state.settings.currentServiceId) ??
    state.services[0] ?? { id: 'svc_upc', name: 'UPC', shortName: 'UPC' }
  )
}

export function setCurrentService(serviceId: string) {
  if (!state.services.some((s) => s.id === serviceId)) return
  state = {
    ...state,
    settings: { ...state.settings, currentServiceId: serviceId },
  }
  persist()
}

export function verifyPin(role: Role, pin: string): boolean {
  if (role === 'staff') return pin === state.settings.staffPin
  return pin === state.settings.adminPin
}

export function updateSettings(partial: Partial<AppState['settings']>) {
  state = { ...state, settings: { ...state.settings, ...partial } }
  persist()
}

export function getActivePatients(): Patient[] {
  return state.patients
    .filter((p) => p.status === 'active')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getPatient(id: string): Patient | undefined {
  return state.patients.find((p) => p.id === id)
}

export function addPatient(input: { admissionNumber: string; bed: string }) {
  const patient: Patient = {
    id: createId('p'),
    admissionNumber: input.admissionNumber.trim(),
    bed: input.bed.trim(),
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  state = { ...state, patients: [...state.patients, patient] }
  persist()
  return patient
}

export function updatePatient(
  id: string,
  partial: Partial<Pick<Patient, 'admissionNumber' | 'bed' | 'status'>>,
) {
  state = {
    ...state,
    patients: state.patients.map((p) => (p.id === id ? { ...p, ...partial } : p)),
  }
  persist()
}

export function closePatient(id: string) {
  updatePatient(id, { status: 'closed' })
}

export function getActiveSupplies(): Supply[] {
  return state.supplies
    .filter((s) => s.active)
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1
      return a.name.localeCompare(b.name, 'es')
    })
}

export function addSupply(name: string) {
  const supply: Supply = {
    id: createId('s'),
    name: name.trim(),
    favorite: false,
    active: true,
  }
  state = { ...state, supplies: [...state.supplies, supply] }
  persist()
  return supply
}

export function updateSupply(
  id: string,
  partial: Partial<Pick<Supply, 'name' | 'favorite' | 'active'>>,
) {
  state = {
    ...state,
    supplies: state.supplies.map((s) => (s.id === id ? { ...s, ...partial } : s)),
  }
  persist()
}

export function getPatientHistory(patientId: string): ChargeBatch[] {
  return state.history
    .filter((h) => h.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPatientTotals(
  patientId: string,
  onlyPending = false,
): Array<ChargeLine & { quantity: number }> {
  const map = new Map<string, ChargeLine>()
  for (const batch of state.history) {
    if (batch.patientId !== patientId) continue
    if (onlyPending && batch.transferred) continue
    for (const line of batch.lines) {
      const prev = map.get(line.supplyId)
      if (prev) {
        prev.quantity += line.quantity
      } else {
        map.set(line.supplyId, { ...line })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es'))
}

/** Totales pendientes agrupados por servicio (para pasar al sistema). */
export function getPendingTotalsByService(patientId: string): Array<{
  serviceId: string
  serviceName: string
  lines: ChargeLine[]
}> {
  const byService = new Map<string, { serviceName: string; lines: Map<string, ChargeLine> }>()

  for (const batch of state.history) {
    if (batch.patientId !== patientId || batch.transferred) continue
    let group = byService.get(batch.serviceId)
    if (!group) {
      group = { serviceName: batch.serviceName, lines: new Map() }
      byService.set(batch.serviceId, group)
    }
    for (const line of batch.lines) {
      const prev = group.lines.get(line.supplyId)
      if (prev) prev.quantity += line.quantity
      else group.lines.set(line.supplyId, { ...line })
    }
  }

  return [...byService.entries()]
    .map(([serviceId, g]) => ({
      serviceId,
      serviceName: g.serviceName,
      lines: [...g.lines.values()].sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es')),
    }))
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName, 'es'))
}

export function getHistoryItemCount(patientId: string): number {
  return getPatientHistory(patientId).length
}

export function getPendingQuantity(patientId: string): number {
  return getPatientTotals(patientId, true).reduce((sum, l) => sum + l.quantity, 0)
}

export function confirmChargeBatch(
  patientId: string,
  draft: Record<string, number>,
): ChargeBatch | null {
  const lines: ChargeLine[] = []
  for (const [supplyId, quantity] of Object.entries(draft)) {
    if (!quantity || quantity <= 0) continue
    const supply = state.supplies.find((s) => s.id === supplyId)
    if (!supply) continue
    lines.push({
      supplyId,
      supplyName: supply.name,
      quantity,
    })
  }
  if (!lines.length) return null

  const service = getCurrentService()
  const batch: ChargeBatch = {
    id: createId('h'),
    patientId,
    serviceId: service.id,
    serviceName: service.name,
    createdAt: new Date().toISOString(),
    lines,
    transferred: false,
  }
  state = { ...state, history: [...state.history, batch] }
  persist()
  return batch
}

export function markPatientHistoryTransferred(patientId: string) {
  state = {
    ...state,
    history: state.history.map((h) =>
      h.patientId === patientId && !h.transferred ? { ...h, transferred: true } : h,
    ),
  }
  persist()
}

export function clearAllData() {
  state = {
    settings: {
      clinicLabel: 'Clínica Demo',
      currentServiceId: 'svc_upc',
      staffPin: '1234',
      adminPin: '0000',
    },
    services: defaultServices,
    patients: [],
    supplies: defaultSupplies,
    history: [],
  }
  persist()
}

export function loadDemoData() {
  state = defaultState()
  persist()
}
