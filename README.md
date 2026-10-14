# cucumber-style example

Example of Playwright BDD setup for CommonJS TypeScript project with Cucumber-style steps.

## Resultados para Xray

Al ejecutar los tests se generan estos archivos:

- `cucumber-report/report.html`: reporte visual.
- `cucumber-report/xray-results.json`: resultados en formato Cucumber JSON, compatible con la importacion de resultados de ejecucion de Xray.

Ejecuta la suite con:

```bash
npm test
```

En Xray, importa `cucumber-report/xray-results.json` desde la opcion de importar resultados Cucumber JSON. Cada escenario debe incluir su clave de test Xray como tag, por ejemplo `@NESGPTAI-5947`.

## Prompt Library

La cobertura de `features/promptLibrary.feature` utiliza el page object
`pages/promptLibraryPage.ts` y los steps de `steps/promptLibrarySteps.ts`.
Incluye navegacion, categorias (crear, renombrar, cancelar y eliminar),
prompts (crear, editar, cancelar y eliminar), pin/unpin, ordenacion por titulo
y carga del contenido de un prompt en un chat nuevo sin enviar el mensaje.
La eliminacion de una categoria tambien verifica que sus prompts se muevan a General.

Ejecuta solo estos escenarios con:

```bash
npm test -- --grep "@prompt-library"
```

En Windows PowerShell, utiliza `npm.cmd` si la politica de ejecucion bloquea `npm.ps1`.
Los escenarios reutilizan la autenticacion existente mediante `@auth`, la vista
desktop de la configuracion de Playwright y los reportes/evidencias existentes.
Si la sesion guardada ha caducado, ejecuta primero el escenario de login:

```bash
npm test -- --grep "User log in NesGPT$" --workers=1
```

Cada escenario genera nombres unicos y elimina solo sus propios prompts y
categorias. Los errores de limpieza hacen fallar el test en lugar de ocultarse.
La feature utiliza `@mode:default` para ejecutar sus escenarios de forma
secuencial e independiente, aunque la configuracion global tenga `fullyParallel`.
Todos utilizan la misma cuenta: las modificaciones simultaneas de su biblioteca
pueden hacer que un prompt guardado no aparezca en las respuestas posteriores.
Las demas features mantienen su ejecucion en paralelo; no ejecutes varias
instancias de esta feature a la vez con la misma cuenta.
El page object espera una respuesta correcta al guardar un prompt y permite
hasta 30 segundos para que las actualizaciones asincronas aparezcan en la UI.
Los escenarios nuevos no incluyen claves Xray inventadas; anade los tags de los
tests correspondientes cuando esten disponibles.

## Discover NesGPT

La cobertura de `features/discoverNesGPT.feature` utiliza el page object
`pages/discoverNesGPTPage.ts` y los steps de `steps/discoverNesGPTSteps.ts`.
Los 10 escenarios acceden desde el menu de la homepage y verifican la cabecera,
la navegacion, la introduccion y los nueve temas de About y Help.
Cada tema comprueba su URL, breadcrumb, contenido, visibilidad de los titulos
y enlaces. Los enlaces externos no se abren; se verifica que sean visibles y
tengan una URL valida.

```bash
npm test -- --grep "@discover-nesgpt"
```

Son tests de solo lectura, reutilizan `@auth` y pueden ejecutarse en paralelo.
Las claves Xray se deben anadir cuando esten disponibles.

## Helpers y limpieza

Los page objects comparten un unico handler de WalkMe por pagina. Los tours se
cierran cuando aparecen, sin esperas fijas de 2 segundos en la homepage ni de
1,5 segundos al abrir Chat History. Las acciones y comprobaciones utilizan el
auto-wait de Playwright con timeouts acotados.

Los steps de Chat History mantienen datos independientes por escenario y nombres
unicos de menos de 32 caracteres. La limpieza se ejecuta en los siete escenarios
mediante `@chat-history`, busca chats pinned y unpinned con paginacion y elimina
solo los titulos exactos creados por ese escenario. Utiliza la autenticacion de
las peticiones de la aplicacion, sin guardar tokens en archivos ni escribir en
`cleanup-debug.log`. Los errores de HTTP o de formato hacen fallar la limpieza
de forma explicita, en lugar de dejar datos sin notificar.

```bash
npm test -- --grep "@chat-history"
```

La autenticacion existente, los tags Xray, los reportes y la ejecucion secuencial
de Prompt Library se mantienen. `npm test` utiliza los ejecutables locales de
las dependencias instaladas, sin invocar `npx` en cada ejecucion.