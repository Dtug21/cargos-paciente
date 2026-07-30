# Cargos paciente

**Producto de [Dito Labs SpA](https://github.com/Dtug21) — registro inmediato y trazable de insumos por paciente para servicios clínicos.**

📄 **[Propuesta comercial (PROPUESTA.md)](PROPUESTA.md)** — modelo de negocio SaaS, opciones de conexión (Supabase / servidor propio), roadmap y valores referenciales.

🔗 **[Prototipo funcional en línea](https://dtug21.github.io/cargos-paciente/)** — se abre en cualquier dispositivo.

> Estado: prototipo funcional para demo en vivo. Los datos viven en el dispositivo (`localStorage`). El siguiente paso para un piloto real es conectar un backend compartido (por ejemplo Supabase) para sincronizar entre equipos.

## El problema que resuelve

Hoy, en la unidad, los insumos usados se anotan a mano en una hoja durante el turno. Por urgencia o volumen de trabajo, muchas cosas no se anotan o se anotan de más — la clínica termina con cuentas en negativo por sub-registro, o cobros mal hechos por sobre-registro. El pase al sistema queda en manos del mismo personal clínico, que ya está sobrecargado.

Este prototipo separa las dos tareas:

- **Personal clínico** marca lo que saca del stock **en el momento**, con dos toques, desde una tablet fija en el punto de insumos (o desde el celular).
- **Administrativo** ve todas las cargas del día consolidadas y las pasa al sistema.

## Cómo se usa

```bash
npm install
npm run dev
```

Abrir la URL en el navegador. Es una PWA: en Chrome/Edge se puede **Instalar app** / “Agregar a la pantalla de inicio”, funciona igual que una app nativa.

### Perfil personal (kiosco — sin PIN)

La tablet queda amarrada a su unidad. La pantalla de inicio muestra la unidad en grande — un toque entra directo, sin login.

1. Pacientes ordenados por número de cama.
2. Aparecen **solo los insumos que esa unidad tiene en stock**.
3. **Sacar / usar** → marcar cantidades → **Cargar insumos** → elegir **quién** lo saca (obligatorio) → confirmar.
4. **Devolver** → solo lista los insumos ya cargados; se resta del total para evitar cobros de más. No permite devolver más de lo cargado.
5. **Historial** por paciente con quién cargó cada cosa y opción de **Anular** (deja rastro, no borra).

### Perfil administrativo (PIN `0000`)

- **Turno** — por defecto muestra solo las cargas del día, con toggle para ver todo lo pendiente. Por paciente: el total a pasar agrupado por servicio, y debajo el detalle de quién cargó qué, con nombre, unidad y hora. Botón **Pasar al sistema** por paciente y **Copiar todo** al portapapeles.
- **Uso** — ranking de insumos más usados en la unidad, con % del total y filtro por 7 / 30 días / histórico. Sirve para **decidir qué llevar en los carritos de enfermería** y ajustar el stock. No mide desempeño individual.
- **Insumos** — catálogo; cada insumo se etiqueta con las unidades que lo tienen en stock.
- **Personal** — alta y baja de profesionales/técnicos por unidad.

### Rutina típica

1. **Personal** (tablet en la unidad) toca paciente → marca lo que saca en el momento y elige su nombre; si algo vuelve, lo **devuelve**.
2. **Admin** entra a **Turno**, ve quién cargó qué y desde qué unidad, revisa el total neto y confirma el pase al sistema de la clínica.
3. Al egreso, admin **cierra** el paciente.

## Identidad visual

Los tokens de marca viven en [`src/index.css`](src/index.css) (`@theme`) y se aplican con la regla 60-30-10:

- Azul institucional `#0C3866` (`bg-brand` / `text-brand`) — estructura: app bar, títulos, chips de selección.
- Verde lima `#8CC63F` (`bg-accent`) — **solo** acciones críticas (Cargar, Confirmar, Pasar al sistema). Siempre con **texto azul** (`text-brand`), nunca blanco: el lima no contrasta con blanco (contraste 1.9:1, reprueba WCAG). Con texto azul da ~6:1 y pasa AA.
- Fondo `#F4F6F8`, superficies blancas, tinte azul `#E9F0F7` para estados seleccionados.
- Semánticos independientes de la marca: éxito `#28A745`, error `#DC3545`. Las devoluciones usan ámbar como advertencia (para distinguirlas del "OK" verde).

## Confidencialidad

El paciente se identifica solo por **cama + N° de admisión**, sin nombre ni RUT. **No se guarda dato sensible**, lo que simplifica cualquier revisión con informática o comité de datos.

## Estructura del proyecto

```
src/
├── App.tsx             — layout, header, pestañas por rol
├── main.tsx            — entry
├── LoginScreen.tsx     — kiosco de inicio + PIN admin
├── PatientForm.tsx     — alta/edición + lista de pacientes activos
├── ChargeScreen.tsx    — vista del paciente: cargar / devolver / historial
├── CatalogPanel.tsx    — admin: catálogo de insumos por unidad
├── PeoplePanel.tsx     — admin: personal por unidad
├── ShiftScreen.tsx     — admin: turno del día (agregado + detalle)
├── UsageStatsScreen.tsx — admin: uso agregado por insumo
├── ServicePicker.tsx   — selector de unidad
├── ConfirmDialog.tsx   — modal de confirmación
├── store.ts            — estado + persistencia en localStorage
├── types.ts            — tipos del dominio
├── useAppState.ts      — hook para suscribirse al store
└── index.css           — tokens de marca (Tailwind v4 @theme)
```

Stack: React 19 + TypeScript 6 + Tailwind CSS 4 + Vite 8 + PWA plugin.

## Comandos

- `npm run dev` — dev server (puerto 5173)
- `npm run build` — build de producción → `dist/`
- `npm run lint` — oxlint
- `npm run preview` — servidor local del build de producción

## Deploy

El resultado de `npm run build` es una carpeta `dist/` estática. Se puede desplegar en cualquier hosting estático:

- **Vercel / Netlify**: importar el repo, build command `npm run build`, output `dist/`.
- **GitHub Pages**: publicar la carpeta `dist/`.
- **Servidor de la clínica**: copiar `dist/` a cualquier servidor web.

Al ser PWA, la primera visita cachea la app y funciona sin conexión en visitas siguientes.

## Roadmap para pasar de prototipo a piloto

- **Backend compartido** (Supabase u otro): que las tablets del servicio y el computador del administrativo vean el mismo estado en tiempo real. El modelo de datos ya está pensado para eso — las cargas son eventos independientes que se suman, no se pisan entre equipos.
- **Login por persona** (opcional): hoy la atribución es por selector rápido al confirmar. Con backend real se puede tener sesión persistente por dispositivo.
- **Sincronización con el sistema de facturación**: hoy es copiar/pegar. Con integración real, el botón "Pasar al sistema" empuja directamente vía API.

## Sobre Dito Labs SpA

Cargos paciente es un producto de **Dito Labs SpA**. Contacto comercial: Diego Ulloa.

Para consultas sobre implementación, piloto o modelos de licenciamiento, ver [PROPUESTA.md](PROPUESTA.md).
