export type Role = 'staff' | 'admin'

/** Servicio clínico desde el que se cobra (UPC, Urgencia, Pabellón, MQ…). */
export type Service = {
  id: string
  name: string
  shortName: string
}

export type Patient = {
  id: string
  admissionNumber: string
  bed: string
  status: 'active' | 'closed'
  createdAt: string
}

export type Supply = {
  id: string
  name: string
  favorite: boolean
  active: boolean
  /** Unidades que tienen este insumo en stock. Vacío = disponible en todas. */
  serviceIds: string[]
}

/** Profesional o técnico que puede figurar como responsable de una carga. */
export type Person = {
  id: string
  name: string
  /** Cargo: Enfermero/a, TENS, Médico/a, etc. */
  role: string
  /** Unidades donde trabaja. Vacío = aparece en todas. */
  serviceIds: string[]
  active: boolean
}

export type ChargeLine = {
  supplyId: string
  supplyName: string
  quantity: number
}

/** Una carga confirmada: queda en el historial del paciente. */
export type ChargeBatch = {
  id: string
  patientId: string
  /** Servicio desde el que se cargó (para cobro). */
  serviceId: string
  serviceName: string
  createdAt: string
  lines: ChargeLine[]
  /** Quién hizo la carga (obligatorio al confirmar). */
  chargedById?: string
  chargedByName?: string
  /** Si ya se pasó al sistema de la clínica. */
  transferred: boolean
  /**
   * 'charge' = insumos usados (suma al total).
   * 'return' = insumos devueltos que se sacaron pero no se usaron (resta al total).
   */
  kind: 'charge' | 'return'
  /** Carga anulada: se registró por error. Queda en el historial pero no cuenta. */
  voided?: boolean
}

export type AppSettings = {
  clinicLabel: string
  currentServiceId: string
  staffPin: string
  adminPin: string
}

export type AppState = {
  settings: AppSettings
  services: Service[]
  patients: Patient[]
  supplies: Supply[]
  people: Person[]
  history: ChargeBatch[]
}
