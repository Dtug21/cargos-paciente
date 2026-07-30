# Propuesta: sistema de carga de insumos por paciente

**Documento de respaldo para presentación a jefatura**
**Prototipo funcional:** [https://dtug21.github.io/cargos-paciente/](https://dtug21.github.io/cargos-paciente/)
**Autor:** Diego Ulloa (profesional clínico)

---

## Resumen ejecutivo

Este documento presenta un prototipo funcional para **registrar de forma inmediata y trazable los insumos utilizados por paciente**, y separar esa tarea del pase final al sistema de facturación de la clínica.

El objetivo es corregir dos problemas conocidos que hoy generan cuentas en negativo y cobros mal hechos:

1. **Sub-registro**: insumos que se sacan y usan pero no se anotan por falta de tiempo o por olvido.
2. **Sobre-registro**: insumos que se anotan por anticipado o por defecto, y se cobran sin haberse usado.

La app está diseñada para que el personal clínico marque lo que saca **en el momento**, con dos toques, desde una tablet fija en el punto de insumos (o desde el celular). El personal administrativo ve todas las cargas del día consolidadas y las pasa al sistema con la información completa: qué, cuánto, quién y desde qué unidad.

El prototipo ya está construido, es responsive (funciona igual en celular, tablet o PC) y se puede probar hoy desde el link de arriba.

---

## Problema actual

En la práctica clínica del servicio, los insumos se anotan a mano en una hoja durante el turno. Esa hoja tiene varios puntos de fricción:

- **Arranca vacía.** Antes de anotar cualquier insumo hay que escribir a mano el nombre y datos generales del paciente. Fricción justo en el momento en que menos tiempo hay.
- **Depende de la memoria del que sacó el insumo.** En una urgencia se saca lo necesario y anotarlo queda "para después" — y después no pasa.
- **No permite corregir con precisión.** Si se saca de más y se devuelve, o si se anotó por defecto algo que no se usó, no hay una forma limpia de descontarlo.
- **La responsabilidad de pasar al sistema recae en el mismo personal clínico**, ya sobrecargado.

**El resultado agregado es pérdida financiera para la clínica** (por sub-registro, que es lo más común) y cobros mal hechos que perjudican al paciente (por sobre-registro).

---

## Qué hace la app

### Perfil clínico (kiosco, sin PIN)

Pensado para una **tablet fija en el punto donde se sacan los insumos**, o para el celular del personal del turno.

- La tablet queda **amarrada a su unidad**. La pantalla de inicio muestra la unidad en grande. Un toque entra directo, sin login, para no perder segundos en una urgencia.
- Pacientes ordenados **por número de cama**. Un toque abre el paciente.
- Aparecen **solo los insumos que esa unidad tiene en stock** — no un catálogo genérico infinito.
- Modo **sacar / usar**: marcar cantidades con `+` y `-`, confirmar la carga, elegir **quién** la hizo (obligatorio) y confirmar. La carga queda en el historial del paciente.
- Modo **devolver**: para insumos que se sacaron pero no se usaron. Muestra solo lo que está cargado, no deja devolver más de lo cargado, y resta del total del paciente. Así se elimina la posibilidad de cobrar de más.
- **Anular**: si una carga se registró por error, se puede anular. Deja de contar para el cobro pero queda marcada en el historial (no se borra: hay rastro).
- **Historial por paciente**: cada carga o devolución muestra quién la hizo, desde qué unidad y a qué hora.

### Perfil administrativo (con PIN)

Diseñado para el personal administrativo del servicio o de la unidad de facturación.

- **Pacientes**: lista con el total pendiente de cada uno.
- **Turno**: la vista principal. Muestra por defecto solo las cargas del día, con opción de ver todo lo pendiente. Por paciente muestra:
  - El **total a pasar**, agrupado por unidad de origen (para facilitar el pase al sistema de facturación).
  - Debajo, cada carga individual con nombre del responsable, unidad y hora.
  - Botón **"Copiar todo"** para llevar el detalle al portapapeles y pegarlo en el sistema.
  - Botón **"Pasar al sistema"** por paciente, que marca las cargas como transferidas.
- **Uso**: ranking de insumos más usados en la unidad, con cantidad y porcentaje sobre el total. Filtros por 7 días, 30 días o histórico completo. Pensado para **respaldar decisiones de stock y diseño de carritos de enfermería**. No mide desempeño individual.
- **Personal**: alta y baja de profesionales/técnicos por unidad. Cada persona figura en su unidad, así el selector "quién cargó" en la tablet solo muestra a quienes trabajan ahí.

### Confidencialidad

El paciente se identifica solo por **cama y número de admisión**, sin nombre ni RUT. **No se guarda ningún dato sensible del paciente**, lo que simplifica cualquier revisión con informática o el comité de datos de la clínica.

---

## Arquitectura actual del prototipo

Hoy la app funciona como una **PWA (Progressive Web App) instalable**. Esto significa:

- Se abre desde cualquier navegador (Chrome, Edge, Safari).
- Se puede **instalar como app** en la tablet o el celular ("Agregar a la pantalla de inicio"), y a partir de ahí abre como si fuera nativa, sin barra de navegador.
- **Los datos viven en el propio dispositivo** (`localStorage`). Un tablet ve solo lo suyo; el computador administrativo ve solo lo suyo.

Esta limitación es intencional para el prototipo: permite probar la experiencia en cualquier equipo sin infraestructura. **Para un piloto real es imprescindible conectar los perfiles** para que las cargas del personal clínico lleguen efectivamente al administrativo.

---

## Cómo conectar los perfiles: opciones técnicas

Este es el paso más importante y donde jefatura debe tomar una decisión, porque tiene implicancias de infraestructura, seguridad y costos. Hay dos caminos principales y una alternativa complementaria.

### Opción A — Backend en la nube gestionada (propuesta del autor: **Supabase**)

Supabase es una plataforma en la nube que ofrece base de datos, autenticación y sincronización en tiempo real sin necesidad de mantener un servidor. Se usa en producción por miles de organizaciones.

**Cómo funcionaría:**
- Todos los dispositivos (tablets del servicio, computador administrativo) apuntan a la misma base de datos alojada en Supabase.
- Cuando el personal clínico confirma una carga, se sincroniza en segundos con la vista del administrativo. **No hay que refrescar ni tocar nada** — el cambio aparece solo.
- Backups automáticos administrados por Supabase.
- Cifrado en tránsito (HTTPS) y en reposo.

**Ventajas:**
- **Puesta en marcha rápida**: se puede tener funcionando en horas, no semanas.
- **Sin infraestructura propia**: no se necesita servidor, ni mantención, ni área de TI dedicada a esto.
- **Tier gratuito generoso**: para el volumen esperado del servicio (una unidad, decenas de pacientes por día), no requiere pago inicial.
- **Real-time nativo**: es lo que resuelve el problema de "que el administrativo vea las cargas apenas se hacen".

**Consideraciones:**
- Los datos viven en servidores externos a la clínica (Supabase corre en AWS). Como la app no guarda datos identificables del paciente (solo cama y N° de admisión), **no hay información sensible de salud saliendo de la clínica**, pero conviene consultarlo con el área de datos o compliance.
- Requiere conexión a Internet. Si se cae Internet, las tablets siguen funcionando (los cambios se sincronizan cuando vuelve la conexión).

### Opción B — Servidor propio en la red de la clínica

Alternativa que **mantiene todos los datos dentro de la infraestructura interna** de la clínica. Es la respuesta natural si el área de datos o TI prefiere que nada salga de la red local.

**Cómo funcionaría:**
- Se instala un pequeño servidor dentro de la red local de la clínica. Puede ser una máquina virtual en el mismo cluster que usa TI para otras aplicaciones internas, o incluso un PC dedicado.
- Ese servidor corre la base de datos y una pequeña API para que las tablets y el computador administrativo se conecten.
- Las tablets se conectan por WiFi de la clínica a la dirección interna del servidor. **Los datos nunca salen de la red del hospital.**
- Backups gestionados por el área de TI de la clínica, según la política que ya tengan.

**Ventajas:**
- **Cero dependencia de terceros**: infraestructura y datos 100% dentro de la clínica.
- **Encaja con políticas de datos estrictas**.
- Sin costos de nube.

**Consideraciones:**
- Requiere que el área de TI de la clínica destine tiempo a levantar y mantener el servidor.
- Setup más largo (días o semanas, no horas).
- Si falla el servidor interno, hay que tener un plan de contingencia interno (backups, redundancia).

**Software recomendado para esta opción:**
- **Supabase self-hosted** (misma tecnología que la Opción A, pero corriendo dentro de la clínica). Es una alternativa concreta que combina lo mejor de ambos mundos.
- **PocketBase** (aún más liviano, un solo ejecutable).
- **PostgreSQL + una API mínima** desarrollada a medida.

### Opción C — Complementaria: modo offline

Independiente de A o B, la app **puede funcionar sin conexión** durante lapsos cortos. Si la tablet pierde WiFi, las cargas se guardan localmente y se sincronizan cuando vuelva la conexión. Esto ya está soportado por la arquitectura PWA y no requiere trabajo adicional.

### Recomendación del autor

Empezar con **Supabase (Opción A)** para el piloto:

- Permite probar el flujo completo con jefatura y personal en semanas, no meses.
- No compromete infraestructura de la clínica en la fase experimental.
- Si el piloto es exitoso, la **migración a Opción B (Supabase self-hosted)** es directa: se pueden mover los datos y cambiar la URL de conexión sin reescribir la app.

De esta forma la clínica **prueba primero con bajo compromiso** y decide después si quiere internalizar la infraestructura.

---

## Trazabilidad y auditoría

Cada carga registra automáticamente:
- Insumo y cantidad
- Fecha y hora exacta
- Persona responsable (elegida al confirmar)
- Unidad desde donde se cargó
- Estado (pendiente, pasado al sistema, anulada, devolución)

Esto significa que ante cualquier discrepancia el administrativo puede reconstruir la historia del paciente sin ambigüedad.

**Importante:** el objetivo de la trazabilidad **no es vigilar al personal**. Es dar respaldo objetivo cuando el cobro final se cuestione, y permitir corregir problemas de forma justa.

---

## Escalabilidad

El diseño soporta más de una unidad simultáneamente sin cambios de código:
- Cada tablet elige su unidad al ser instalada (UPC, Urgencia, MQ, Pabellón, etc.).
- Los insumos y el personal se etiquetan por unidad.
- El administrativo ve todo consolidado, con el origen claro de cada carga.

Si el piloto en una unidad funciona, extender a otras unidades es solo agregar tablets configuradas para esas unidades.

---

## Consideraciones de seguridad

- Los datos que la app maneja **no incluyen información identificable de pacientes** (nombre, RUT, diagnósticos). Solo cama, número de admisión, insumos y responsables.
- La app se sirve por HTTPS.
- El acceso al perfil administrativo está protegido por PIN.
- Con backend real (Opción A o B), se agregaría autenticación por dispositivo o por persona, según la política de seguridad de la clínica.

---

## Roadmap propuesto

| Fase | Alcance | Tiempo estimado |
|---|---|---|
| **1. Prototipo funcional** | Ya listo. App en línea, demostrable en cualquier dispositivo. | Completado |
| **2. Validación con jefatura y personal** | Presentar la app, recibir feedback, ajustar catálogo real de insumos y personal. | 1–2 semanas |
| **3. Piloto con backend (Supabase)** | Conectar los perfiles en tiempo real. Piloto en una unidad. | 2–4 semanas |
| **4. Evaluación del piloto** | Medir reducción de sub-registro, tiempo de pase al sistema, satisfacción del personal. | 1 mes de operación |
| **5. Decisión de expansión** | Continuar en Supabase gestionada o migrar a servidor interno; extender a otras unidades. | Definido tras el piloto |

---

## Costos aproximados

| Fase | Item | Costo |
|---|---|---|
| Piloto (Opción A) | Supabase tier gratuito | $0 |
| Piloto (Opción A) | Hosting de la app (GitHub Pages / Vercel gratuito) | $0 |
| Piloto (Opción A) | 2 tablets estándar de gama media (si aún no las hay) | Costo de tablets |
| Operación (Opción A) | Supabase Pro (si crece el uso) | ~USD 25/mes |
| Alternativa (Opción B) | Servidor interno + horas de TI | A definir con área de TI |

Para la fase de piloto y validación en una unidad, **el costo de infraestructura es cero**. El único costo real es el tiempo del personal para probarlo y darle feedback.

---

## Conclusión

El prototipo demuestra que el flujo completo — desde que el personal clínico marca un insumo hasta que el administrativo lo pasa al sistema — es viable y rápido de usar en el punto de atención.

El paso siguiente natural es **conectar los perfiles** para que las cargas fluyan entre dispositivos en tiempo real. Supabase es el camino más corto para probarlo en semanas y sin comprometer infraestructura de la clínica. Si el piloto valida el modelo, la misma tecnología puede migrarse a un servidor interno.

**La decisión que se solicita a jefatura es autorizar el piloto en una unidad**, con acompañamiento del personal clínico y administrativo, para medir el impacto real en la calidad del cobro y en el tiempo del personal.

---

## Anexos

- **Repositorio del código fuente:** [github.com/Dtug21/cargos-paciente](https://github.com/Dtug21/cargos-paciente)
- **App en línea (prototipo funcional):** [dtug21.github.io/cargos-paciente](https://dtug21.github.io/cargos-paciente/)
- **PIN admin para la demo:** `0000`
