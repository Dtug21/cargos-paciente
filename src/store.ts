import type {
  AppState,
  ChargeBatch,
  ChargeLine,
  Patient,
  Person,
  Role,
  Service,
  Supply,
} from './types'

const STORAGE_KEY = 'cargos-paciente-v8'

const defaultServices: Service[] = [
  { id: 'svc_upc', name: 'UPC', shortName: 'UPC' },
  { id: 'svc_urg', name: 'Urgencia', shortName: 'URG' },
  { id: 'svc_mq', name: 'Medicina Quirúrgica', shortName: 'MQ' },
  { id: 'svc_pab', name: 'Pabellón', shortName: 'PAB' },
]

const defaultSupplies: Supply[] = [
  { id: 's1', name: 'Guantes de procedimiento', favorite: true, active: true, serviceIds: [] },
  { id: 's2', name: 'Jeringa 5 ml', favorite: true, active: true, serviceIds: [] },
  { id: 's3', name: 'Jeringa 10 ml', favorite: true, active: true, serviceIds: [] },
  { id: 's4', name: 'Aguja 21G', favorite: false, active: true, serviceIds: [] },
  { id: 's5', name: 'Suero fisiológico 100 ml', favorite: true, active: true, serviceIds: [] },
  { id: 's6', name: 'Gasas estériles', favorite: true, active: true, serviceIds: [] },
  { id: 's7', name: 'Apósito transparente', favorite: false, active: true, serviceIds: [] },
  { id: 's8', name: 'Alcohol 70%', favorite: false, active: true, serviceIds: [] },
  { id: 's9', name: 'Tórulas de algodón', favorite: false, active: true, serviceIds: [] },
  { id: 's10', name: 'Equipo venoclisis', favorite: true, active: true, serviceIds: [] },
  // Insumos de cuidados críticos: solo aparecen en las unidades que los tienen en stock.
  {
    id: 's11',
    name: 'Sonda de aspiración',
    favorite: true,
    active: true,
    serviceIds: ['svc_upc'],
  },
  {
    id: 's12',
    name: 'Filtro HME (ventilación)',
    favorite: false,
    active: true,
    serviceIds: ['svc_upc'],
  },
  {
    id: 's13',
    name: 'Electrodos ECG',
    favorite: false,
    active: true,
    serviceIds: ['svc_upc', 'svc_urg'],
  },
]

const defaultPeople: Person[] = [
  { id: 'per1', name: 'Camila Rojas', role: 'Enfermera', serviceIds: ['svc_upc'], active: true },
  { id: 'per2', name: 'Diego Soto', role: 'TENS', serviceIds: ['svc_upc'], active: true },
  { id: 'per3', name: 'Valentina Pérez', role: 'Enfermera', serviceIds: ['svc_upc'], active: true },
  { id: 'per4', name: 'Matías Fuentes', role: 'TENS', serviceIds: ['svc_urg'], active: true },
  { id: 'per5', name: 'Fernanda Díaz', role: 'Enfermera', serviceIds: [], active: true },
]

function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** Ordena camas de forma natural: "7" antes de "12", "12" antes de "12A". */
function compareBed(a: string, b: string): number {
  const na = parseInt(a, 10)
  const nb = parseInt(b, 10)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
  return a.localeCompare(b, 'es', { numeric: true })
}

/** Signo con el que un lote afecta a los totales: carga suma, devolución resta, anulada no cuenta. */
function batchSign(batch: ChargeBatch): 1 | -1 | 0 {
  if (batch.voided) return 0
  return batch.kind === 'return' ? -1 : 1
}

function defaultState(): AppState {
  return {
    settings: {
      clinicLabel: 'Clínica Nueva Cordillera',
      currentServiceId: 'svc_upc',
      staffPin: '1234',
      adminPin: '0000',
    },
    services: defaultServices,
    patients: [],
    supplies: defaultSupplies,
    people: defaultPeople,
    history: [],
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

  const serviceIdSet = new Set(services.map((s) => s.id))
  const cleanServiceIds = (raw: unknown): string[] =>
    Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string' && serviceIdSet.has(id)) : []

  let supplies = Array.isArray(raw.supplies) ? (raw.supplies as Supply[]) : []
  if (supplies.length === 0) {
    supplies = defaultSupplies
  } else {
    supplies = supplies.map((s) => ({
      id: s.id,
      name: s.name,
      favorite: Boolean(s.favorite),
      active: s.active !== false,
      serviceIds: cleanServiceIds((s as Supply).serviceIds),
    }))
  }

  let people = Array.isArray(raw.people) ? (raw.people as Person[]) : []
  if (people.length === 0 && !Array.isArray(raw.people)) {
    people = defaultPeople
  } else {
    people = people.map((p) => ({
      id: p.id,
      name: p.name,
      role: typeof p.role === 'string' ? p.role : '',
      serviceIds: cleanServiceIds(p.serviceIds),
      active: p.active !== false,
    }))
  }

  let history: ChargeBatch[] = Array.isArray(raw.history) ? (raw.history as ChargeBatch[]) : []
  const fallbackService = services[0]

  history = history.map((h) => ({
    ...h,
    serviceId: h.serviceId || fallbackService.id,
    serviceName: h.serviceName || fallbackService.name,
    kind: h.kind === 'return' ? ('return' as const) : ('charge' as const),
    voided: Boolean(h.voided),
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
      kind: 'charge' as const,
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
    people,
    history,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return normalizeState(JSON.parse(raw) as Record<string, unknown>)
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
  return state.patients.filter((p) => p.status === 'active').sort((a, b) => compareBed(a.bed, b.bed))
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

/** Un insumo o persona pertenece a la unidad si no tiene unidades asignadas (todas) o la incluye. */
function inService(serviceIds: string[], serviceId: string): boolean {
  return serviceIds.length === 0 || serviceIds.includes(serviceId)
}

/** Insumos activos de la unidad indicada (por defecto, la unidad de esta tablet). */
export function getActiveSupplies(serviceId: string = state.settings.currentServiceId): Supply[] {
  return state.supplies
    .filter((s) => s.active && inService(s.serviceIds, serviceId))
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
    serviceIds: [],
  }
  state = { ...state, supplies: [...state.supplies, supply] }
  persist()
  return supply
}

export function updateSupply(
  id: string,
  partial: Partial<Pick<Supply, 'name' | 'favorite' | 'active' | 'serviceIds'>>,
) {
  state = {
    ...state,
    supplies: state.supplies.map((s) => (s.id === id ? { ...s, ...partial } : s)),
  }
  persist()
}

/** Alterna si un insumo está disponible en una unidad. */
export function toggleSupplyService(supplyId: string, serviceId: string) {
  state = {
    ...state,
    supplies: state.supplies.map((s) => {
      if (s.id !== supplyId) return s
      const has = s.serviceIds.includes(serviceId)
      return {
        ...s,
        serviceIds: has
          ? s.serviceIds.filter((id) => id !== serviceId)
          : [...s.serviceIds, serviceId],
      }
    }),
  }
  persist()
}

/** Personal activo de la unidad indicada (por defecto, la unidad de esta tablet). */
export function getActivePeople(serviceId: string = state.settings.currentServiceId): Person[] {
  return state.people
    .filter((p) => p.active && inService(p.serviceIds, serviceId))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function getAllPeople(): Person[] {
  return [...state.people].sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function addPerson(input: { name: string; role: string; serviceIds: string[] }) {
  const person: Person = {
    id: createId('per'),
    name: input.name.trim(),
    role: input.role.trim(),
    serviceIds: input.serviceIds,
    active: true,
  }
  state = { ...state, people: [...state.people, person] }
  persist()
  return person
}

export function updatePerson(
  id: string,
  partial: Partial<Pick<Person, 'name' | 'role' | 'serviceIds' | 'active'>>,
) {
  state = {
    ...state,
    people: state.people.map((p) => (p.id === id ? { ...p, ...partial } : p)),
  }
  persist()
}

export function togglePersonService(personId: string, serviceId: string) {
  state = {
    ...state,
    people: state.people.map((p) => {
      if (p.id !== personId) return p
      const has = p.serviceIds.includes(serviceId)
      return {
        ...p,
        serviceIds: has
          ? p.serviceIds.filter((id) => id !== serviceId)
          : [...p.serviceIds, serviceId],
      }
    }),
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
    const sign = batchSign(batch)
    if (sign === 0) continue
    for (const line of batch.lines) {
      const prev = map.get(line.supplyId)
      if (prev) {
        prev.quantity += sign * line.quantity
      } else {
        map.set(line.supplyId, { ...line, quantity: sign * line.quantity })
      }
    }
  }
  return [...map.values()]
    .filter((l) => l.quantity > 0)
    .sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es'))
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
    const sign = batchSign(batch)
    if (sign === 0) continue
    let group = byService.get(batch.serviceId)
    if (!group) {
      group = { serviceName: batch.serviceName, lines: new Map() }
      byService.set(batch.serviceId, group)
    }
    for (const line of batch.lines) {
      const prev = group.lines.get(line.supplyId)
      if (prev) prev.quantity += sign * line.quantity
      else group.lines.set(line.supplyId, { ...line, quantity: sign * line.quantity })
    }
  }

  return [...byService.entries()]
    .map(([serviceId, g]) => ({
      serviceId,
      serviceName: g.serviceName,
      lines: [...g.lines.values()]
        .filter((l) => l.quantity > 0)
        .sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es')),
    }))
    .filter((g) => g.lines.length > 0)
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName, 'es'))
}

export function getHistoryItemCount(patientId: string): number {
  return getPatientHistory(patientId).length
}

/** Inicio del día calendario actual, en ISO. Útil para filtrar "cargas de hoy". */
export function startOfToday(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Cargas pendientes (sin pasar ni anular) de un paciente, opcionalmente desde una fecha, más recientes primero. */
export function getPendingBatches(patientId: string, since?: string): ChargeBatch[] {
  return state.history
    .filter(
      (h) =>
        h.patientId === patientId &&
        !h.transferred &&
        !h.voided &&
        (!since || h.createdAt >= since),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPendingQuantity(patientId: string): number {
  return getPatientTotals(patientId, true).reduce((sum, l) => sum + l.quantity, 0)
}

/** Como getPendingTotalsByService pero acotado por fecha. */
function getPendingTotalsByServiceSince(
  patientId: string,
  since?: string,
): Array<{ serviceId: string; serviceName: string; lines: ChargeLine[] }> {
  const byService = new Map<string, { serviceName: string; lines: Map<string, ChargeLine> }>()

  for (const batch of state.history) {
    if (batch.patientId !== patientId || batch.transferred) continue
    if (since && batch.createdAt < since) continue
    const sign = batchSign(batch)
    if (sign === 0) continue
    let group = byService.get(batch.serviceId)
    if (!group) {
      group = { serviceName: batch.serviceName, lines: new Map() }
      byService.set(batch.serviceId, group)
    }
    for (const line of batch.lines) {
      const prev = group.lines.get(line.supplyId)
      if (prev) prev.quantity += sign * line.quantity
      else group.lines.set(line.supplyId, { ...line, quantity: sign * line.quantity })
    }
  }

  return [...byService.entries()]
    .map(([serviceId, g]) => ({
      serviceId,
      serviceName: g.serviceName,
      lines: [...g.lines.values()]
        .filter((l) => l.quantity > 0)
        .sort((a, b) => a.supplyName.localeCompare(b.supplyName, 'es')),
    }))
    .filter((g) => g.lines.length > 0)
    .sort((a, b) => a.serviceName.localeCompare(b.serviceName, 'es'))
}

/** Resumen del turno para admin: pacientes activos con cargos pendientes (opcional: desde una fecha). */
export function getPendingSummary(since?: string): Array<{
  patient: Patient
  pendingCount: number
  byService: Array<{ serviceId: string; serviceName: string; lines: ChargeLine[] }>
}> {
  return getActivePatients()
    .map((patient) => {
      const byService = getPendingTotalsByServiceSince(patient.id, since)
      const pendingCount = byService.reduce(
        (sum, g) => sum + g.lines.reduce((s, l) => s + l.quantity, 0),
        0,
      )
      return { patient, pendingCount, byService }
    })
    .filter((row) => row.pendingCount > 0)
}

/**
 * Ranking de insumos más usados en una unidad, para diseñar carritos y ajustar stock.
 * Considera cargas menos devoluciones, ignora anuladas. Se puede filtrar por rango.
 */
export function getUsageStats(options: {
  serviceId?: string
  sinceDays?: number
}): { totalUnits: number; lines: Array<{ supplyId: string; supplyName: string; quantity: number }> } {
  const since =
    typeof options.sinceDays === 'number'
      ? new Date(Date.now() - options.sinceDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined
  const map = new Map<string, { supplyName: string; quantity: number }>()

  for (const batch of state.history) {
    if (batch.voided) continue
    if (options.serviceId && batch.serviceId !== options.serviceId) continue
    if (since && batch.createdAt < since) continue
    const sign = batch.kind === 'return' ? -1 : 1
    for (const line of batch.lines) {
      const prev = map.get(line.supplyId)
      if (prev) prev.quantity += sign * line.quantity
      else map.set(line.supplyId, { supplyName: line.supplyName, quantity: sign * line.quantity })
    }
  }

  const lines = [...map.entries()]
    .map(([supplyId, v]) => ({ supplyId, supplyName: v.supplyName, quantity: v.quantity }))
    .filter((l) => l.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)

  const totalUnits = lines.reduce((sum, l) => sum + l.quantity, 0)
  return { totalUnits, lines }
}

export function confirmChargeBatch(
  patientId: string,
  draft: Record<string, number>,
  kind: 'charge' | 'return' = 'charge',
  personId?: string,
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
  const person = personId ? state.people.find((p) => p.id === personId) : undefined
  const batch: ChargeBatch = {
    id: createId('h'),
    patientId,
    serviceId: service.id,
    serviceName: service.name,
    createdAt: new Date().toISOString(),
    lines,
    transferred: false,
    kind,
    chargedById: person?.id,
    chargedByName: person?.name,
  }
  state = { ...state, history: [...state.history, batch] }
  persist()
  return batch
}

/** Anula un lote pendiente (registrado por error). Queda en el historial marcado. */
export function voidChargeBatch(batchId: string) {
  state = {
    ...state,
    history: state.history.map((h) =>
      h.id === batchId && !h.transferred ? { ...h, voided: true } : h,
    ),
  }
  persist()
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
  state = defaultState()
  persist()
}

export function loadDemoData() {
  state = defaultState()
  persist()
}
