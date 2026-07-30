# Propuesta comercial: Cargos paciente

**Producto de Dito Labs SpA para la gestión inmediata y trazable de insumos por paciente**

**Prototipo funcional disponible en:** [https://dtug21.github.io/cargos-paciente/](https://dtug21.github.io/cargos-paciente/)
**Contacto comercial:** Diego Ulloa · Dito Labs SpA

---

## Resumen ejecutivo

**Cargos paciente** es un producto de software desarrollado por Dito Labs SpA para clínicas y servicios hospitalarios que necesitan **corregir la pérdida financiera provocada por el sub-registro de insumos**.

En la mayoría de los servicios clínicos, los insumos se anotan a mano en una hoja durante el turno. Ese método genera dos pérdidas silenciosas pero recurrentes:

1. **Sub-registro** (el problema más costoso): insumos sacados y usados que no se anotan por falta de tiempo o por olvido. La clínica los pagó al proveedor pero no puede cobrarlos al paciente ni a la aseguradora.
2. **Sobre-registro**: insumos anotados por defecto que nunca se usaron, generando cobros mal hechos que después la clínica tiene que corregir o reembolsar.

Ambos problemas afectan directamente la línea de resultado del servicio, y ninguno se resuelve con más presión al personal clínico — el problema es la **herramienta**, no la voluntad.

**Cargos paciente** entrega la herramienta correcta: registro al pie del insumo, en dos toques, con trazabilidad completa (qué, cuánto, quién, cuándo, desde qué unidad). El pase al sistema de facturación lo hace el personal administrativo con toda la información consolidada.

El prototipo está listo, funcional, y puede evaluarse hoy desde el link anterior.

---

## Qué hace Cargos paciente

### Perfil clínico (tablet o celular en el punto de insumos)

- **Sin PIN, sin login, sin fricción.** Un toque y se está registrando.
- Tablet amarrada a su unidad (la de UPC muestra UPC, la de Pabellón muestra Pabellón).
- Pacientes ordenados por número de cama.
- Solo se ven los **insumos que esa unidad tiene en stock**.
- Registro en dos toques: marcar cantidades y confirmar con el nombre del responsable (obligatorio, pero un tap).
- **Devoluciones nativas**: si se sacó de más, se registra la devolución. La app no permite devolver más de lo cargado. Elimina el sobre-registro.
- **Anulación con rastro**: cualquier carga se puede anular si fue un error; queda marcada, no desaparece. Auditable siempre.
- Historial por paciente con quién cargó cada cosa y desde qué unidad.

### Perfil administrativo (con PIN)

- **Turno**: vista de todas las cargas del día, agrupadas por paciente, con total consolidado y detalle de cada carga individual (nombre, unidad, hora). Botón "Copiar todo" para llevar el detalle al portapapeles y pegarlo en el sistema de facturación. Botón "Pasar al sistema" por paciente.
- **Uso**: ranking de insumos más consumidos en la unidad, con filtros de 7 / 30 días / histórico. **Base objetiva para diseñar carritos de enfermería y ajustar stock.** No mide desempeño individual.
- **Pacientes**: lista de todos los activos con indicador de "sin pasar".
- **Personal**: alta y baja de responsables por unidad.

### Confidencialidad y compliance

El paciente se identifica solo por **cama y número de admisión**, sin nombre ni RUT. **No se guarda información sensible de salud del paciente**, lo que simplifica la revisión con el área de compliance o el comité de datos.

---

## Impacto esperado en la clínica

Esta app no automatiza un lujo — corrige una **fuga de ingresos** que hoy la clínica está absorbiendo sin visibilidad.

### Fuentes de valor

1. **Recuperación de ingresos por sub-registro corregido.** Cada insumo que hoy se saca sin registrar es un cobro perdido. Ejemplos típicos en una unidad de cuidados:
   - Un frasco de suero fisiológico sin registrar por turno × 3 turnos × 30 días = 90 cobros perdidos al mes por ese solo insumo.
   - Multiplicado por todo el catálogo (guantes, jeringas, gasas, sondas, apósitos, catéteres…) el monto agregado es material.
2. **Reducción de cobros erróneos** que después la clínica tiene que corregir, reembolsar, o defender con el paciente/aseguradora. Además del costo directo, esto **erosiona la relación con la aseguradora** y consume tiempo administrativo.
3. **Base de datos para decisiones de stock.** La vista **Uso** entrega evidencia agregada para diseñar carritos de enfermería con los insumos correctos, evitando quiebres y compras de emergencia.
4. **Descarga del personal clínico**: dejan de ser responsables del pase al sistema, se enfocan en atender pacientes.

Dito Labs propone al servicio una **medición explícita del impacto durante el piloto**: comparar el volumen de insumos cargados en el sistema durante un mes con Cargos paciente vs. el mes previo con hoja en papel. Ese delta es la evidencia dura del valor entregado.

---

## Cómo se conectan el personal clínico y el administrativo

Este es el paso técnico central para la operación real, y donde jefatura debe tomar una decisión de infraestructura.

### Opción A — Backend gestionado en la nube (recomendación de Dito Labs: **Supabase**)

Supabase es una plataforma en la nube que ofrece base de datos, autenticación y sincronización en tiempo real sin necesidad de mantener un servidor. Es la tecnología que usa Dito Labs para desplegar el sistema.

**Cómo funcionaría:**
- Todos los dispositivos (tablets del servicio, computador administrativo) apuntan a la misma base de datos en Supabase.
- Cuando el personal clínico confirma una carga, aparece en la vista del administrativo en segundos. **Real-time nativo**, sin necesidad de refrescar.
- Backups automáticos, cifrado en tránsito y en reposo.

**Ventajas:**
- **Puesta en marcha rápida**: piloto operativo en semanas, no meses.
- **Cero infraestructura propia**: la clínica no tiene que destinar TI a levantar servidores.
- **Real-time nativo**: resuelve el requisito "que las tablets y el computador administrativo vean lo mismo al instante".

**Consideraciones:**
- Los datos viven en servidores externos a la clínica. Como Cargos paciente no guarda información identificable del paciente, no hay datos sensibles de salud saliendo de la clínica; aún así conviene validarlo con compliance.
- Requiere conexión a Internet. Si se cae, las tablets siguen operando y sincronizan cuando vuelve la conexión (modo offline nativo).

### Opción B — Servidor propio en la red de la clínica

Alternativa para clínicas que prefieren **mantener todos los datos dentro de su infraestructura interna**.

**Cómo funcionaría:**
- Dito Labs despliega la misma solución en un servidor dentro de la red local de la clínica (puede ser una máquina virtual del cluster que ya usa TI para otras aplicaciones internas).
- Las tablets se conectan al servidor por WiFi hospitalario. **Los datos nunca salen de la red interna.**
- Los backups se gestionan según la política de TI de la clínica.

**Ventajas:**
- **Cero dependencia de terceros**: infraestructura y datos 100% dentro de la clínica.
- **Encaja con políticas de datos estrictas**.

**Consideraciones:**
- Setup más largo (semanas) y requiere coordinación con TI para provisión de servidor.
- Costo de mantención asumido por la clínica.

### Recomendación de Dito Labs

**Empezar con Opción A (Supabase gestionada) para el piloto.** Si el piloto valida el modelo, la migración a Opción B es directa: Dito Labs mueve los datos y reconfigura la app sin reescribir nada. Esta ruta minimiza el compromiso técnico inicial y maximiza velocidad de aprendizaje.

---

## Modelo de negocio

Cargos paciente se ofrece bajo un modelo **SaaS (Software as a Service)**: la clínica paga una suscripción mensual por unidad activa; Dito Labs se hace cargo de hosting, sincronización, backups, actualizaciones continuas y soporte.

### Fase 1 — Configuración inicial (una sola vez)

Trabajo de puesta en marcha que Dito Labs realiza con el servicio:

- Carga del **catálogo real de insumos** de la unidad en el sistema.
- Alta del **personal clínico** (nombres, cargos, unidades).
- Configuración de las tablets del servicio (WiFi, unidad asignada, instalación como PWA).
- **Capacitación** al personal clínico (30 min) y al administrativo (60 min).
- Definición de KPI del piloto (volumen esperado, métricas de éxito).

**Rango referencial:** CLP 800.000 – 1.500.000 (una vez), según cantidad de insumos, cantidad de personal a cargar y complejidad del catálogo.

### Fase 2 — Suscripción mensual por unidad activa

**Rango referencial:** CLP 80.000 – 150.000 por unidad/mes.

**Incluye:**
- Hosting en Supabase gestionado por Dito Labs.
- Sincronización en tiempo real entre tablets y computador administrativo.
- Backups diarios y recuperación ante desastres.
- Actualizaciones continuas del producto.
- Soporte técnico durante horario laboral.
- Ajustes menores al catálogo y al personal por auto-gestión desde la app.

### Alternativas de modelo

Además del SaaS estándar, Dito Labs puede acordar:

- **Piloto reducido**: primer mes con precio simbólico o gratuito, sujeto a que la clínica se comprometa a medir y compartir el impacto (útil como caso de estudio para ambas partes).
- **Licencia self-hosted anual**: para la Opción B (servidor propio). CLP 3.000.000 – 5.000.000 al año, incluye instalación en la infraestructura de la clínica y actualizaciones.
- **Descuentos por volumen**: si el servicio incorpora más unidades después del piloto, se ajusta el precio por unidad hacia abajo.

**Los valores exactos se ajustan en conversación comercial** según cantidad de unidades, complejidad del catálogo, y modelo de conexión elegido (Opción A o B).

### Argumento económico para la clínica

El costo mensual de la suscripción se **paga solo con un puñado de insumos que hoy se están perdiendo por sub-registro**. La clínica no está evaluando un gasto nuevo, sino recuperando ingresos que ya está dejando de percibir.

Dito Labs propone alinear el precio con esa lógica: en el piloto se mide el volumen recuperado, y el retorno se hace evidente antes de tomar decisiones de expansión.

---

## Trazabilidad y auditoría

Cada carga registra automáticamente:
- Insumo y cantidad
- Fecha y hora exacta
- Persona responsable (elegida al confirmar)
- Unidad desde donde se cargó
- Estado (pendiente, pasado al sistema, anulada, devolución)

Esto permite al administrativo y al servicio reconstruir la historia del cobro de cualquier paciente sin ambigüedad. El objetivo **no es vigilar al personal**, es dar respaldo objetivo ante cualquier discrepancia y sostener el cobro frente al paciente o la aseguradora.

---

## Escalabilidad

El diseño soporta cualquier cantidad de unidades sin cambios de código:

- Cada tablet se configura con su unidad al instalarse (UPC, Urgencia, Medicina Quirúrgica, Pabellón, y cualquier otra).
- Los insumos y el personal se etiquetan por unidad.
- El administrativo consolida todo, con el origen claro de cada carga.

Si el piloto en una unidad funciona, extender el producto a otras unidades del hospital es directo y con costo marginal decreciente por unidad adicional.

---

## Roadmap propuesto

| Fase | Alcance | Tiempo | Responsable |
|---|---|---|---|
| **1. Presentación del prototipo** | Ya listo. App en línea, demostrable en cualquier dispositivo. | Completado | Dito Labs |
| **2. Validación con jefatura y personal** | Reunión de definiciones, ajuste de catálogo y personal reales. | 1–2 semanas | Dito Labs + clínica |
| **3. Configuración e instalación** | Setup del backend Supabase, carga del catálogo, alta de personal, instalación en tablets, capacitación. | 2–3 semanas | Dito Labs |
| **4. Piloto operativo** | Uso real en una unidad con acompañamiento y ajustes. | 1 mes de operación | Dito Labs + servicio |
| **5. Evaluación de impacto** | Medición del volumen recuperado, satisfacción del personal, decisión de continuidad y expansión. | 1 semana | Dito Labs + jefatura |

---

## Consideraciones de seguridad

- Cargos paciente **no maneja datos identificables del paciente** (sin nombres, sin RUT, sin diagnósticos). Solo cama, N° de admisión, insumos y responsables.
- La app se sirve por HTTPS con certificado válido.
- El acceso al perfil administrativo está protegido por PIN.
- En la versión con backend (Opción A o B), se agregan roles y permisos según la política de seguridad de la clínica.
- Dito Labs firma acuerdos de confidencialidad estándar y puede adaptarse a los requerimientos específicos de compliance de la clínica.

---

## Conclusión y próximo paso

El prototipo demuestra que el flujo completo — desde que el personal clínico marca un insumo hasta que el administrativo lo pasa al sistema — es viable y rápido de usar en el punto de atención. La tecnología para escalarlo a producción está resuelta (Supabase para el piloto, con opción de migrar a infraestructura interna).

**Lo que Dito Labs le propone al servicio en esta reunión:**

1. **Autorizar un piloto de un mes en una unidad**, con precio reducido o simbólico durante ese mes.
2. **Definir en conjunto los KPI** que van a medir el éxito (volumen recuperado, tiempo del administrativo, satisfacción del personal).
3. **Revisar los resultados al mes** y decidir la continuidad bajo modelo SaaS estándar.

Este esquema minimiza el riesgo para la clínica y le da a Dito Labs la oportunidad de demostrar el valor con datos, no con promesas.

---

## Anexos

- **App en línea (prototipo funcional):** [dtug21.github.io/cargos-paciente](https://dtug21.github.io/cargos-paciente/)
- **Repositorio del código:** [github.com/Dtug21/cargos-paciente](https://github.com/Dtug21/cargos-paciente)
- **PIN admin para la demo:** `0000`

---

**Contacto**
Diego Ulloa
Dito Labs SpA
