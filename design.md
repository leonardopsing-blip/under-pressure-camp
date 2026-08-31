# Diseño de interfaz móvil — Under Pressure Camp QR

## Enfoque
La aplicación debe sentirse como una herramienta operativa rápida para staff de campamento, optimizada para **uso con una sola mano**, lectura inmediata y decisiones rápidas. El flujo principal es **escanear QR o buscar por cédula/nombre**, abrir la ficha del campista y actuar sobre **comidas** y **pagos** sin navegación compleja.

## Pantallas

### 1. Inicio / Escáner
**Contenido principal**
- Acceso principal a escaneo QR.
- Búsqueda manual por nombre o cédula.
- Resumen operativo: total de campistas, pagados, abonados, no pagados y comidas registradas.
- Alerta de nuevos campistas detectados desde el Sheet de respuestas.

**Funcionalidad**
- Escanear QR.
- Buscar campista.
- Abrir ficha rápida.
- Refrescar datos.

### 2. Lista de campistas
**Contenido principal**
- Lista con nombre, cédula, estado de pago y alertas de salud/dieta.
- Filtros por estado de pago y por alertas.

**Funcionalidad**
- Buscar.
- Filtrar.
- Abrir detalle.

### 3. Detalle del campista
**Contenido principal**
- Nombre completo.
- Cédula.
- Edad.
- Contactos de emergencia (solo nombres y números).
- Red en casa: sí/no y cuál.
- Enfermedad: sí/no y cuál.
- Medicación: sí/no y cuál.
- Alergia: sí/no y cuál.
- Dieta por tratamiento.
- Estado de pago visual: **verde pagado**, **naranja abonado**, **rojo no pagado**.
- Comidas: 2 desayunos, 2 almuerzos, 2 cenas.
- Comprobantes asociados.

**Funcionalidad**
- Marcar comidas una sola vez.
- Registrar abono o pago completo.
- Adjuntar foto de comprobante.
- Ver historial de pagos/comprobantes.

### 4. Registro de pago
**Contenido principal**
- Campista seleccionado.
- Tipo de registro: abono o pago completo.
- Método: efectivo, transferencia, depósito, datáfono/datafácil.
- Detalles de referencia.
- Foto del comprobante.

**Funcionalidad**
- Guardar registro en la hoja operativa nueva.
- No modificar pagos históricos ya existentes en los links originales.

### 5. Nuevos campistas / alertas
**Contenido principal**
- Campistas detectados recientemente en el Sheet de respuestas.
- Nombre y acceso directo a pagos.

**Funcionalidad**
- Notificación visual dentro del demo.
- Redirección directa al detalle/pagos.

## Flujos clave

### Flujo QR
1. Usuario abre la app.
2. Toca **Escanear QR**.
3. Escanea código del campista.
4. La app abre la ficha del campista.
5. Usuario revisa datos críticos, marca comida o registra pago.

### Flujo de comida
1. Usuario abre ficha del campista.
2. Revisa dieta/alergia.
3. Marca desayuno/almuerzo/cena correspondiente.
4. El registro queda guardado como definitivo en la hoja operativa.

### Flujo de pago
1. Usuario abre ficha del campista.
2. Revisa estado actual.
3. Si no está pagado, registra abono o pago completo.
4. Adjunta comprobante si aplica.
5. El estado se recalcula sin exponer montos en la interfaz principal.

## Estilo visual
- Estética tipo **iOS first-party**: tarjetas limpias, jerarquía clara, botones grandes, alto contraste.
- Fondo claro, tipografía fuerte, acentos deportivos/juveniles.
- Colores de estado:
  - **Verde**: pagado
  - **Naranja**: abonado
  - **Rojo**: no pagado
- Color principal sugerido: azul profundo/deportivo con acentos amarillos o naranjas.

## Reglas de datos del demo
- Los dos Google Sheets originales se tratan como **fuentes de solo lectura**.
- La app usa una **hoja operativa nueva** para comidas, pagos nuevos y comprobantes.
- No se exponen montos monetarios en la vista principal.
- La información sensible se muestra de forma compacta y operativa.
