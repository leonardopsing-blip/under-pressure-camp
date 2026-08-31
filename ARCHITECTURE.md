# Arquitectura del primer demo — Under Pressure Camp QR

## Principio rector
Los dos Google Sheets entregados por el usuario se tratan como **fuentes originales de solo lectura**. La aplicación no depende de una app externa para operar: usa un backend propio con base de datos y una hoja operativa nueva como capa de trabajo. Los Sheets originales se leen en vivo para sincronizar campistas y pagos sin modificarlos.

## Fuentes de datos

| Fuente | Uso en el demo | Modo de acceso |
|---|---|---|
| Link 1: pagos y comprobantes | Determinar estado visual de pago, porcentaje pagado y estructura histórica de comprobantes | Solo lectura |
| Link 2: respuestas de campistas | Construir ficha del campista con datos personales, salud, dieta y contactos | Solo lectura |
| Hoja operativa nueva | Guardar comidas marcadas, pagos nuevos, comprobantes nuevos y alertas internas | Lectura/escritura |
| Base de datos del sistema | Servir la app en tiempo real con campistas, pagos, comidas, comprobantes y alertas | Lectura/escritura |

## Modelo funcional
El demo trabaja con una entidad principal llamada **Campista**, identificada por cédula y nombre normalizado. Sobre esa entidad se calculan o almacenan cuatro estados operativos: **estado de pago**, **porcentaje pagado**, **comidas marcadas** y **comprobantes registrados**.

## Estados de pago
La interfaz no muestra montos monetarios en la vista principal. Solo muestra tres estados visuales:

| Estado | Regla del demo | Color |
|---|---|---|
| Pagado | El registro histórico indica pendiente igual a cero | Verde |
| Abonado | Existe un abono histórico mayor a cero y aún hay pendiente | Naranja |
| No pagado | No existe registro histórico compatible o no hay abono | Rojo |

## Porcentaje pagado
El porcentaje se calcula sobre un costo total de referencia de **100**. Si el registro indica un pendiente de 15, el sistema muestra **85% pagado**. Si el pendiente es 0, muestra **100%**. Si no existe pago compatible, muestra **0%**.

## Reglas de escritura del demo
El prototipo puede registrar **nuevos pagos**, **nuevos abonos**, **comidas** y **comprobantes** únicamente en la hoja operativa nueva. No edita filas históricas de los links originales. Si un campista paga completo o abona, el demo guarda un nuevo registro operativo y recalcula el estado visible en la app.

## QR y búsqueda
El QR del demo debe contener idealmente la **cédula** del campista o un texto compatible con nombre/cédula. Como respaldo, la app incluye búsqueda manual por nombre o cédula para evitar bloqueos operativos.

## Alertas de nuevos campistas
La hoja de respuestas sigue siendo la fuente viva. La app sincroniza periódicamente esa fuente hacia la base de datos del sistema. Los campistas ya existentes fueron marcados como registrados, por lo que ya no aparecen como nuevos; solo futuros registros generarán alerta.

## Sincronización en vivo
La aplicación ya no depende de una app externa para consultar la información. El backend lee directamente los dos Google Sheets en modo solo lectura, normaliza nombres, calcula porcentajes y guarda snapshots operativos en la base de datos. Esto permite que la interfaz vea los datos de todos los campistas y refleje cambios recientes sin tocar los archivos originales.
