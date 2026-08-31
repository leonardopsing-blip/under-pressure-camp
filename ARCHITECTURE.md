# Arquitectura del primer demo — Under Pressure Camp QR

## Principio rector
Los dos Google Sheets entregados por el usuario se tratan como **fuentes originales de solo lectura**. El primer demo no modifica esos archivos. Para operación diaria se creó una hoja nueva, separada, llamada **Under Pressure Camp - Operación Demo 2026**, que funciona como capa operativa del prototipo.

## Fuentes de datos

| Fuente | Uso en el demo | Modo de acceso |
|---|---|---|
| Link 1: pagos y comprobantes | Determinar estado visual de pago y entender estructura histórica de comprobantes | Solo lectura |
| Link 2: respuestas de campistas | Construir ficha del campista con datos personales, salud, dieta y contactos | Solo lectura |
| Hoja operativa nueva | Guardar comidas marcadas, pagos nuevos, comprobantes nuevos y alertas internas | Lectura/escritura |

## Modelo funcional
El demo trabaja con una entidad principal llamada **Campista**, identificada por cédula y nombre normalizado. Sobre esa entidad se calculan o almacenan tres estados operativos: **estado de pago**, **comidas marcadas** y **comprobantes registrados**.

## Estados de pago
La interfaz no muestra montos monetarios en la vista principal. Solo muestra tres estados visuales:

| Estado | Regla del demo | Color |
|---|---|---|
| Pagado | El registro histórico indica pendiente igual a cero | Verde |
| Abonado | Existe un abono histórico mayor a cero y aún hay pendiente | Naranja |
| No pagado | No existe registro histórico compatible o no hay abono | Rojo |

## Reglas de escritura del demo
El prototipo puede registrar **nuevos pagos**, **nuevos abonos**, **comidas** y **comprobantes** únicamente en la hoja operativa nueva. No edita filas históricas de los links originales. Si un campista paga completo o abona, el demo guarda un nuevo registro operativo y recalcula el estado visible en la app.

## QR y búsqueda
El QR del demo debe contener idealmente la **cédula** del campista o un texto compatible con nombre/cédula. Como respaldo, la app incluye búsqueda manual por nombre o cédula para evitar bloqueos operativos.

## Alertas de nuevos campistas
La hoja de respuestas sigue siendo la fuente viva. Para el primer demo se implementa una alerta visual basada en comparación entre la fuente de respuestas y la base operativa ya conocida. Además, la hoja operativa nueva queda preparada para sincronización automática desde el Forms: cada nuevo registro detectado en la pestaña de respuestas se copia hacia la pestaña operativa sin modificar el Sheet original.

## Límite deliberado del primer demo
Todavía no se aplica la línea de código en Apps Script para unir los dos Sheets originales entre sí. Lo que sí se deja implementado es un mecanismo de sincronización desde el Forms hacia la hoja operativa nueva, de modo que los nuevos campistas aparezcan automáticamente en la operación del demo sin tocar el archivo original de respuestas.
