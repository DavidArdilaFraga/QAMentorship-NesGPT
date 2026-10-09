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