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
  /** Si ya se pasó al sistema de la clínica. */
  transferred: boolean
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
  history: ChargeBatch[]
}
