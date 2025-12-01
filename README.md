Control de Etiquetas Site Rosario – PWA
Aplicación web progresiva (PWA) para control de etiquetas en depósito, diseñada para operarios no técnicos, con memoria persistente y prevención de escaneos duplicados.

Objetivo de la aplicación
La app permite controlar etiquetas de bultos a partir de un archivo Excel (HR), validando qué etiquetas fueron escaneadas y generando un archivo de resultado para control y trazabilidad.

Está pensada para:
Operarios de depósito que escanean etiquetas con lector de código de barras.​
Supervisores que necesitan exportar el control en Excel.​
Entornos con posibles cortes de internet o recargas accidentales de la página.​

Funcionalidades principales
Importar archivo Excel (.xlsx) con columnas: Referencia, Etiqueta, Destino, Ciudad, Ruta.​
Navegación jerárquica: Rutas → Ciudades → Destinos → Referencias → Etiquetas.​
Visualización de contadores de progreso: validadas / total en cada nivel.​
Validación de etiquetas mediante checkbox por cada etiqueta.​
Exportación a Excel con una columna adicional Estado (OK para etiquetas validadas).​
Funcionamiento como PWA (instalable en móvil y usable offline una vez cargada).​

Flujo de uso
El usuario abre la app y ve la pantalla de bienvenida.​
Abre el menú y selecciona Importar HR.​
Elige el archivo Excel con las columnas requeridas.​
La app carga las etiquetas, crea el estado interno y navega a la vista de Rutas.​

El usuario navega por:
Ruta → Ciudad → Destino → Referencia → Etiquetas.​
Desde cualquier vista puede abrir el buscador para escanear etiquetas.​
Cada escaneo:
Marca la etiqueta como validada si es nueva.​
Emite solo sonido de “duplicado” si ya fue ingresada.​
En todo momento se muestran contadores de validadas / total.​
Al finalizar, el usuario abre el menú y elige Exportar a Excel, generando un archivo con columna Estado.​

Si el usuario elige Salir, la app:
Ofrece exportar si hay etiquetas validadas.​
Pide confirmación antes de limpiar el estado.​

