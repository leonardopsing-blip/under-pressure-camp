# Notas clave del proyecto

## Fuentes originales
- Link 1 pagos y comprobantes: https://docs.google.com/spreadsheets/d/1N1gUvlJhudApEbYrnPePk9k43Ujo5IVl1fqLExjxeNI/edit?usp=sharing
- Link 2 datos de campistas: https://docs.google.com/spreadsheets/d/12fN7DQB3VwUO_ydeuFuoAvF570rVVVvTyn29g-utl-M/edit?usp=sharing

## Hoja operativa creada
- Under Pressure Camp - Operación Demo 2026: https://docs.google.com/spreadsheets/d/1fgNlXn70PAE2JDcvZVjepxEEQ4c4FnS_2HlIUKEP13k/edit

## Decisiones importantes
- Los dos enlaces originales se mantienen como fuentes de solo lectura.
- La app usa backend propio con base de datos; no depende de una app externa para consultar información.
- El backend sincroniza en vivo desde los dos Google Sheets usando exportación CSV de solo lectura.
- El costo total del campamento se toma como 100 para calcular porcentaje pagado.
- Los campistas históricos ya no aparecen como nuevos; solo futuros registros generan alerta.

## Resultados verificados
- Total campistas sincronizados: 53.
- Ejemplo validado: Valeria Tatiana Hidalgo Quimi aparece con 85% pagado.
- Ejemplo validado: Allan Andre Uscocovich Barzallo aparece con 20% pagado.
- Ejemplo validado: Úrsula Camila Calderón Gutiérrez aparece con 100% pagado.

## Observaciones visuales pendientes de pulir
- En la captura web, el hero superior se ve demasiado espaciado y el botón de escaneo queda visualmente desplazado; conviene compactar el encabezado.
- La alerta de nuevos campistas ya no debe mostrar registros históricos.
