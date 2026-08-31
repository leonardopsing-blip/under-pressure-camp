# Sincronización automática Forms → hoja operativa

La respuesta corta es **sí**: la información del Google Forms puede pasar automáticamente al nuevo Sheet operativo a medida que alguien se registre. Para este demo ya dejé creada la hoja operativa y el código de sincronización, pero la activación automática dentro de Google Apps Script requiere un permiso adicional de Google que la sesión actual no tiene habilitado.

## Qué ya quedó listo

Ya existe una hoja nueva llamada **Under Pressure Camp - Operación Demo 2026** con estas pestañas: `Campistas_Operacion`, `Comidas`, `Pagos_Nuevos`, `Comprobantes_Nuevos` y `Alertas_Nuevos_Campistas`. También quedó preparado el código de Apps Script en `scripts/apps-script-sync.gs` para copiar automáticamente los nuevos campistas desde el Forms hacia esa hoja operativa.

## Qué hará la automatización cuando se active

Cada vez que entre un nuevo registro del Forms, el sistema copiará el campista a `Campistas_Operacion`, creará una alerta en `Alertas_Nuevos_Campistas` y mantendrá intactos los dos enlaces originales. La app podrá entonces mostrar el nuevo campista y redirigir a pagos.

## Qué falta para activarla en Google

Hay que instalar el script en la cuenta de Google con permiso para Apps Script. La sesión actual pudo crear el archivo del proyecto de script, pero Google devolvió **insufficient authentication scopes** al intentar subir el contenido. En cuanto autorices ese permiso, puedo dejarla activada.

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
