# Plan de Pruebas — Editor de Documentos y Modelos

---

## Flujo 1 — Plantillas (Modelos)

### 1.1 Creación de plantilla

- [ ] Ir a `/herramientas/plantillas` y hacer clic en "Nueva plantilla"
- [ ] Verificar que el editor TipTap carga con toolbar completo (fuente, tamaño, negrita, cursiva, alineación, interlineado, etc.)
- [ ] Insertar merge fields de cada grupo desde el panel lateral:
  - [ ] Expediente (número, carátula, juzgado, fuero, secretaría, jurisdicción)
  - [ ] Cliente (nombre, apellido, nombre completo, DNI, CUIT, domicilio, email, teléfono)
  - [ ] Contraparte (nombre, DNI, domicilio, representante)
  - [ ] Letrado (nombre completo, colegio, matrícula, domicilio constituido, email)
  - [ ] Fechas (fecha de hoy, fecha de hoy escrita)
  - [ ] Movimiento (fecha, tipo, título, descripción)
  - [ ] Cálculo (monto total, capital, interés, descripción, fecha, tipo, etc.)
- [ ] Verificar que los merge fields se muestran como chips coloreados en el editor
- [ ] Aplicar estilos: negrita, cursiva, subrayado, tamaño de fuente, interlineado, alineación
- [ ] Asignar nombre y categoría a la plantilla
- [ ] Guardar y verificar que aparece en el listado de plantillas

### 1.2 Edición de plantilla

- [ ] Abrir una plantilla existente desde el listado
- [ ] Modificar contenido y guardar cambios
- [ ] Verificar que los cambios se persisten correctamente

### 1.3 Vista previa

- [ ] Ver preview de una plantilla desde el listado
- [ ] Verificar que los merge fields se muestran como chips con colores por grupo

### 1.4 Eliminación

- [ ] Eliminar una plantilla y verificar que desaparece del listado

---

## Flujo 2 — Escritos (Documentos)

### 2.1 Creación desde plantilla

- [ ] Ir a `/documentos/escritos` y hacer clic en "Nuevo escrito"
- [ ] Seleccionar una plantilla del listado
- [ ] Verificar que el editor carga con el contenido de la plantilla y los merge fields como chips

### 2.2 Autocompletado de merge fields

- [ ] Vincular un expediente (folder) y verificar que se resuelven los campos de expediente
- [ ] Vincular cliente y verificar resolución de campos (nombre, apellido, nombre completo)
- [ ] Vincular contraparte y verificar resolución de campos
- [ ] Seleccionar un movimiento:
  - [ ] Verificar que carga los primeros movimientos del expediente
  - [ ] Verificar paginación con botón "Cargar más (X de Y)"
  - [ ] Verificar que al seleccionar un movimiento se resuelven sus campos
- [ ] Seleccionar un cálculo y verificar resolución de campos
- [ ] Si el usuario tiene más de 1 matrícula, verificar que aparece el selector de letrado/skill
- [ ] Hacer clic en "Resolver campos" y verificar que todos los chips se reemplazan por sus valores
- [ ] Verificar contador de campos pendientes (badge rojo)

### 2.3 Guardado y generación de PDF

- [ ] Guardar el documento y verificar que aparece en el listado
- [ ] Abrir el documento desde el listado
- [ ] Ver PDF generado: verificar que carga correctamente (sin "PDF no disponible")
- [ ] Descargar el PDF y verificar el archivo

### 2.4 Gestión de documentos

- [ ] Buscar un documento por título en el listado
- [ ] Filtrar documentos por estado (borrador, final, etc.)
- [ ] Editar un documento existente y guardar cambios
- [ ] Eliminar un documento y verificar que desaparece del listado

### 2.5 Creación sin plantilla

- [ ] Crear un documento nuevo sin seleccionar plantilla (editor en blanco)
- [ ] Escribir contenido libre y guardar

### 2.6 Chat AI

- [ ] Abrir el panel de chat AI en el editor
- [ ] Enviar un mensaje y verificar que la respuesta llega en streaming (SSE via axios onDownloadProgress)
- [ ] Verificar que el AI usa el contenido del documento como contexto (switch "Incluir documento como contexto")
- [ ] Activar el switch y pedir al AI que edite el documento; verificar que aparece el chip "N cambios aplicados" y que el documento se modifica directamente
- [ ] Verificar que Ctrl+Z deshace los cambios aplicados por el AI
- [ ] Si hay un movimiento con PDF adjunto, activar "Adjuntar PDF del movimiento"
- [ ] Enviar mensaje con PDF adjunto y verificar que el AI lo referencia en su respuesta
- [ ] Verificar que el texto sugerido por el AI entre triple backtick se puede insertar con un clic
- [ ] Verificar que el botón de cancelar (⬛) durante el streaming aborta la conexión correctamente
- [ ] Verificar que si el token expira durante la sesión, el panel refresca el token automáticamente y reintenta (misma lógica que la API principal)

### 2.7 Persistencia del historial de chat (pendiente — mejora futura)

**Estado actual:** el historial se mantiene en memoria del componente mientras el panel esté abierto. Al cerrarlo y reabrirlo, o al navegar a otra ruta, el historial se pierde.

**Mejora propuesta:** persistir el historial en MongoDB asociado al `documentId` y `userId`.
- Backend (`law-analytics-server`): nuevo endpoint + modelo `DocumentChatHistory` con `[{role, content}]`, TTL configurable y límite de mensajes
- Frontend: cargar historial al abrir el panel, guardar en cada intercambio
- Decisiones de diseño a confirmar: ¿historial por documento o por usuario?, ¿cuántos mensajes conservar?, ¿guardar chip de ediciones aplicadas?

---

## Flujo 3 — Suscripciones y Límites de Recursos

### 3.1 Plan Free — límites de plantillas y documentos

- [ ] Verificar cuántas plantillas permite el plan free
- [ ] Intentar crear una plantilla adicional superando el límite
- [ ] Verificar que aparece el modal de upgrade (`LimitErrorModal`)
- [ ] Verificar que el modal muestra los planes disponibles con precios y features
- [ ] Verificar que el modal muestra chips "Recomendado" / "Popular" según corresponda
- [ ] Repetir para documentos (escritos)

### 3.2 Modal de upgrade

- [ ] Verificar que los planes se muestran correctamente (Standard, Premium)
- [ ] Verificar que las features visibles corresponden al entorno (development/production)
- [ ] Verificar que los recursos (límites) se muestran en la grilla
- [ ] Hacer clic en "Suscribirme Ahora" y verificar redirección al flujo de pago de Stripe
- [ ] Verificar botón "Mejorar" con color warning

### 3.3 Rate limit del chat AI

- [ ] Verificar que el endpoint `/rag/editor/chat` aplica rate limit (40 req/min)
- [ ] Superar el límite y verificar respuesta de error en el panel de chat

### 3.4 Movimientos PJN — límite free

- [ ] Con una carpeta PJN y plan free, verificar que solo se muestran 5 movimientos
- [ ] Verificar que el botón "Cargar más" aparece indicando que hay más disponibles con plan superior

### 3.5 Comportamiento del servidor ante límites

- [ ] Superar el límite de documentos vía API y verificar que el servidor responde con error 402/403
- [ ] Verificar que el frontend captura el error y abre el modal de upgrade automáticamente
- [ ] Repetir para plantillas

---

## Notas

- Probar en navegador con plan **Free** activo primero
- Luego repetir pruebas críticas con plan **Standard** o **Premium**
- Registrar cualquier comportamiento inesperado con screenshot y descripción del paso fallido
