# Sincronización automática Forms → hoja operativa

La respuesta corta es **sí**: la información del Google Forms puede pasar automáticamente al nuevo Sheet operativo a medida que alguien se registre. En esta nueva iteración ya no dependemos de una app externa para consultar los datos: el backend del sistema lee directamente los dos Google Sheets en modo solo lectura y sincroniza la base de datos de la app.

## Qué ya quedó listo

Ya existe una hoja nueva llamada **Under Pressure Camp - Operación Demo 2026** con estas pestañas: `Campistas_Operacion`, `Comidas`, `Pagos_Nuevos`, `Comprobantes_Nuevos` y `Alertas_Nuevos_Campistas`. Además, el backend ya sincroniza en vivo campistas y pagos hacia la base de datos del sistema.

## Qué hará la automatización cuando se active

Cada vez que entre un nuevo registro del Forms, el sistema lo detecta en la siguiente sincronización, lo inserta en la base de datos y genera una alerta de nuevo campista. La app podrá entonces mostrar el nuevo campista y redirigir a pagos.

## Qué falta para activarla en Google

La sincronización en vivo ya funciona desde el backend. La automatización adicional con Apps Script queda como refuerzo opcional para escribir también en la hoja operativa nueva en tiempo real.

## Esquema de comidas implementado

La app ya quedó ajustada con este esquema exacto:

| Tipo | Día |
|---|---|
| Desayuno | Sábado |
| Desayuno | Domingo |
| Almuerzo | Sábado |
| Almuerzo | Domingo |
| Cena | Viernes |
| Cena | Sábado |
