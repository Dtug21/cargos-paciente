# Cargo Unidad

PWA para cargar insumos del stock de la unidad por paciente (cama + N° de admisión) y pasarlos rápido al sistema de la clínica.

## Cómo usar

```bash
npm install
npm run dev
```

Abrí la URL en el celular o tablet. En Chrome/Edge: **Instalar app** / “Agregar a la pantalla de inicio”.

### Personal (`1234`)

1. Pestaña **Pacientes**: agregar solo con **cama** + **N° admisión**
2. Tocá el paciente → perfil de carga (se abre en la pestaña **Cargar**)
3. Marcá cantidades → **Cargar insumos** → confirmá el resumen
4. Queda en el **Historial** del paciente, sumándose a lo que carguen otros

### Admin (`0000`)

1. Pestaña **Pacientes**: ve un aviso **"X sin pasar"** en los pacientes con cargos pendientes
2. Tocá el paciente → se abre directo en **Historial**: el total acumulado y cada carga que fue llegando
3. **Pasar al sistema** (arriba) abre un cuadro de diálogo con el detalle exacto a agregar → revisa → **Confirmar y pasar**
4. La pestaña **Cargar** sigue disponible, pero es de uso excepcional: solo si admin necesita cerrar a un paciente y le preguntó al enfermero/TENS qué insumos usó
5. Pestaña **Insumos** (catálogo) para editar el stock de la unidad

### Rutina típica

1. **Admin** mantiene actualizada la lista de pacientes (admisión + cama).
2. **Personal** toca paciente → toca insumos → confirma la carga (queda en el historial).
3. **Admin** entra al paciente, ve el detalle acumulado, abre **Pasar al sistema**, revisa el diálogo y confirma.
4. Al egreso, admin **cierra** el paciente.

## Nota técnica

Los datos viven en `localStorage` del dispositivo (sirve para probar ya). Para que **todas las tablets vean lo mismo en tiempo real** hay que conectar un backend compartido (ej. Supabase).
