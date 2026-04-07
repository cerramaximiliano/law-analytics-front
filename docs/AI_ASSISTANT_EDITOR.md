# Asistente IA — Editor de Documentos

## Índice
1. [Visión general](#visión-general)
2. [Bubble de selección (SelectionBubble)](#bubble-de-selección-selectionbubble)
3. [Panel de chat (AiChatPanel)](#panel-de-chat-aichatpanel)
4. [Modo automático: Editar vs Sugerir](#modo-automático-editar-vs-sugerir)
5. [Acciones rápidas](#acciones-rápidas)
6. [Contexto activo](#contexto-activo)
7. [Contexto del caso (caseContext)](#contexto-del-caso-casecontext)
8. [Formato de edición [EDICION]](#formato-de-edición-edicion)
9. [Flujo de ediciones pendientes](#flujo-de-ediciones-pendientes)
10. [Streaming SSE](#streaming-sse)
11. [Archivos involucrados](#archivos-involucrados)

---

## Visión general

El asistente IA del editor opera a través de **dos puntos de entrada** complementarios:

| Componente | Cuándo aparece | Qué hace |
|---|---|---|
| **SelectionBubble** | Al seleccionar texto en el editor | Acciones rápidas inline, directamente sobre la selección |
| **AiChatPanel** | Tab "IA" del panel derecho | Chat completo + acciones rápidas con contexto del documento |

Ambos se comunican con el backend a través de `ragAxios` (`/rag/editor/chat`), que devuelve respuestas en formato **SSE (Server-Sent Events)**.

### Flujo de datos completo

```
document-editor/index.tsx
  │
  ├── caseContext (useMemo)
  │     folderFuero, folderJuris, representedParty,
  │     representationType, actorName, demandadoName
  │
  ├──► SelectionBubble
  │     │  texto seleccionado + caseContext
  │     └──► POST /rag/editor/chat
  │               systemPromptOverride (de la EditorAction)
  │               caseContext → vocabulario de fuero + corpus de estilo
  │
  └──► AiChatPanel
        │  historial de mensajes + documentText + caseContext
        └──► POST /rag/editor/chat
```

---

## Bubble de selección (SelectionBubble)

**Archivo:** `src/pages/herramientas/editor-poc/SelectionBubble.tsx`

Aparece flotando **sobre el texto seleccionado** cada vez que el usuario hace una selección no vacía en el editor. Se posiciona usando `editor.view.coordsAtPos()` y se renderiza en un `Portal` de MUI (fuera del árbol DOM del editor) para evitar problemas de z-index y clipping.

### Interfaz CaseContext

```ts
export interface CaseContext {
  representedParty?: "actor" | "demandado" | null;
  representationType?: "patrocinio" | "apoderado" | null;
  folderName?: string | null;
  actorName?: string | null;
  demandadoName?: string | null;
  folderFuero?: string | null;    // nombre del fuero: "Civil", "Laboral"...
  folderJuris?: string | null;    // jurisdicción: "CABA", "PBA"...
}
```

### Acciones disponibles

| Acción | Scope | Descripción |
|---|---|---|
| **Mejorar** | bubble | Mejora la redacción del texto seleccionado |
| **Corregir** | bubble | Corrige ortografía, gramática y estilo |
| **Formalizar** | bubble | Reformula con estilo jurídico formal argentino, calibrado al fuero |
| **Resumir** | bubble | Resume el texto de forma concisa |

> Las acciones son data-driven: se cargan desde `GET /rag/editor/actions` al montar el componente. Se pueden agregar, modificar o desactivar desde el admin sin tocar código.

### Comportamiento

- Al hacer clic en una acción, envía el texto seleccionado al backend con el prompt de la `EditorAction` y el `caseContext` del expediente activo
- La respuesta **reemplaza inmediatamente** el texto seleccionado en el editor (`insertContentAt`)
- Tras el reemplazo, el nuevo texto queda seleccionado 1.5 segundos como feedback visual
- `onMouseDown={(e) => e.preventDefault()}` evita que el editor pierda el foco al interactuar con el bubble

### Notas técnicas

- **TipTap v3:** `BubbleMenu` fue removido de `@tiptap/react`. El posicionamiento es manual via `coordsAtPos()` + `Portal`
- El bubble se oculta cuando la selección desaparece (evento `selectionUpdate`)
- No envía el documento completo como contexto — solo el texto seleccionado + `caseContext`

---

## Panel de chat (AiChatPanel)

**Archivo:** `src/pages/herramientas/editor-poc/AiChatPanel.tsx`

Panel lateral con tres zonas funcionales, de arriba hacia abajo:

```
┌─────────────────────────────┐
│  [mensajes del chat]        │
│                             │  ← zona scrolleable
├─────────────────────────────┤
│  Acciones rápidas  [modo]   │
│  [chip] [chip] [chip]       │  ← grey.50 background
├─────────────────────────────┤
│  Contexto activo            │
│  ● Documento                │
│  ● Movimiento adjunto       │  ← indicadores radio-button
│  ● Selección: "..."         │
├─────────────────────────────┤
│  [input____________] [send] │  ← input libre
└─────────────────────────────┘
```

### Props disponibles

```ts
interface AiChatPanelProps {
  editor: Editor;
  onClose?: () => void;
  movements?: Movement[];
  movementsLimited?: boolean;
  embedded?: boolean;
  caseContext?: CaseContext | null;   // activa vocabulario + corpus de estilo
}
```

El `caseContext` se pasa desde `document-editor/index.tsx` y contiene los metadatos del expediente seleccionado. Se inyecta en **todas** las requests al backend (chat libre y acciones rápidas).

---

## Modo automático: Editar vs Sugerir

El modo **no es un toggle manual** — se deriva automáticamente del estado de la selección:

| Estado | Modo activo | Indicador | Comportamiento |
|---|---|---|---|
| Hay texto seleccionado | **✏ Editar** | chip primary relleno | Las acciones rápidas reemplazan el texto directamente |
| Sin selección | **💬 Sugerir** | chip secondary relleno | Las acciones rápidas generan ediciones pendientes para confirmar |

El chip es un indicador de solo lectura — muestra el modo vigente con un tooltip explicativo al hovear.

### Por qué esta lógica

- **Con selección:** el usuario ya identificó qué quiere cambiar → acción directa e inmediata
- **Sin selección:** la IA propone cambios sobre el documento completo → es preferible revisar antes de aplicar para evitar modificaciones inesperadas

---

## Acciones rápidas

Definidas en `QUICK_ACTIONS` dentro de `AiChatPanel.tsx`:

| Acción | Prompt enviado |
|---|---|
| Mejorar redacción | "Mejorá la redacción del documento actual" |
| Introducción | "Escribí una introducción formal para este escrito" |
| Cierre | "Sugerí un cierre con petitorio" |
| Corregir estilo | "Corregí el estilo jurídico" |

### Flujo con selección activa

1. El usuario selecciona texto y hace clic en una acción rápida
2. Se envía un prompt directo: `${acción}\n\nTexto a trabajar:\n"${selección}"\n\nDevolvé SOLO el texto resultante`
3. Se incluye `caseContext` para que el backend inyecte vocabulario y corpus de estilo si hay fuero
4. La respuesta reemplaza la selección en el editor (`insertContentAt`)
5. El chat muestra el intercambio con indicador "1 cambio aplicado en el documento"

### Flujo sin selección

1. El usuario hace clic en una acción rápida sin texto seleccionado
2. Se activa el modo Sugerir: el prompt incluye el documento numerado como contexto
3. Al prompt se agrega la instrucción: `"Aplicá los cambios directamente en el documento usando el bloque [EDICION]...[/EDICION]."`
4. La IA devuelve un bloque `[EDICION]` con las operaciones a aplicar
5. Los cambios quedan **pendientes** hasta que el usuario los confirme con "Aplicar cambios"

---

## Contexto activo

El panel muestra indicadores visuales (estilo radio button) sobre qué contexto se está usando:

### Documento

- **Indicador apagado (○):** el texto del documento no se envía al backend
- **Indicador encendido (●):** se envía el documento numerado como contexto
- El usuario puede activarlo/desactivarlo haciendo clic en el indicador o el texto "Documento"
- Las acciones rápidas **siempre fuerzan** el contexto del documento (`overrideIncludeDoc = true`)

### Movimiento adjunto

Permite adjuntar un movimiento judicial como contexto adicional. Fuentes disponibles:

| Tipo | Fuente |
|---|---|
| PDF | URL del documento (`mov.link` en PJN, `att.url` en MEV) |
| Texto | Texto del movimiento (`mov.texto` en MEV) |

Si el plan del usuario es limitado, se muestra un aviso "Solo últimos movimientos · Plan gratuito".

### Selección activa

Si hay texto seleccionado en el editor, se muestra un indicador con una preview del texto seleccionado (máx. 55 caracteres). Este contexto se usa automáticamente en las acciones rápidas cuando hay selección.

---

## Contexto del caso (caseContext)

El `caseContext` es la clave que desbloquea las capacidades jurídicas avanzadas del asistente. Se construye en `document-editor/index.tsx` a partir del expediente seleccionado:

```tsx
const caseContext = useMemo((): CaseContext => ({
  representedParty: representedParty || null,
  representationType: representationType || null,
  folderName: selectedFolder?.folderName || null,
  actorName: selectedContact ? getContactDisplayName(selectedContact) : null,
  demandadoName: selectedContraparte ? getContactDisplayName(selectedContraparte) : null,
  folderFuero: selectedFolder?.folderFuero || null,
  folderJuris: selectedFolder?.folderJuris
    ? typeof selectedFolder.folderJuris === "string"
      ? selectedFolder.folderJuris
      : (selectedFolder.folderJuris as { label?: string }).label || null
    : null,
}), [representedParty, representationType, selectedFolder, selectedContact, selectedContraparte]);
```

### Qué activa cada campo en el backend

| Campo | Efecto en la API |
|-------|-----------------|
| `representedParty` + `representationType` | Instrucción de persona gramatical (primera/tercera) |
| `folderFuero` | Vocabulario específico del fuero + **inyección del corpus de estilo semántico** |
| `folderJuris` | Mención de la jurisdicción en el contexto |
| `folderName` | Mención del expediente en el contexto |
| `actorName` / `demandadoName` | Nombres reales en el contexto |

### El corpus de estilo

Cuando `folderFuero` está presente **y** la acción tiene `systemPromptOverride`, el backend:

1. Embebe el texto del usuario con `text-embedding-3-small`
2. Busca en el índice Pinecone `pjn-style-corpus` los 3 escritos más similares del mismo fuero
3. Los inyecta como ejemplos en el system prompt

Resultado: el LLM calibra su tono, vocabulario y registro al fuero específico usando escritos judiciales reales como referencia.

**Fueros con corpus disponible:** Civil (3.648), Laboral (1.168), Seg. Social (724), Familia (779), Comercial (384).

---

## Formato de edición [EDICION]

Cuando la IA necesita modificar el documento, genera un bloque estructurado en la respuesta:

```
[EDICION][{"op": "replace", "idx": 2, "new": "texto nuevo del párrafo"},
          {"op": "insert_after", "idx": 5, "new": "nuevo párrafo"},
          {"op": "delete", "idx": 3}][/EDICION]
```

### Operaciones disponibles

| `op` | Descripción | Campos requeridos |
|---|---|---|
| `replace` | Reemplaza el contenido del nodo en posición `idx` | `idx`, `new` |
| `insert_after` | Inserta un nuevo párrafo después de `idx` | `idx`, `new` |
| `delete` | Elimina el nodo en posición `idx` | `idx` |

### Numeración del documento

Antes de enviar la solicitud, `buildNumberedContext()` genera una representación numerada del documento:

```
[0] (título N1) RECURSO DE APELACIÓN
[1] Señor Juez:
[2] Que venimos a interponer recurso...
[3] (título N2) I. HECHOS
...
```

- Solo se numeran nodos con contenido textual (se omiten los vacíos)
- Los nodos tipo `heading` incluyen una pista `(título N1)`, `(título N2)`, etc.
- El índice `idx` en las operaciones de edición hace referencia a esta numeración, no a la posición real en el documento
- `indexMap[]` mapea los índices del contexto a los índices reales del JSON del documento

### Aplicación de ediciones

`applyEdits()` procesa las operaciones en **orden inverso** (de mayor a menor `idx`) para evitar que las inserciones desplacen los índices de operaciones posteriores.

---

## Flujo de ediciones pendientes

En modo **Sugerir** (sin selección), las ediciones generadas no se aplican automáticamente:

1. La IA responde con un bloque `[EDICION]`
2. El texto del bloque se **limpia** de la respuesta visible (`stripEditBlock()`)
3. Las operaciones se almacenan en `pendingEdits` (estado del componente)
4. El mensaje del asistente muestra: `"N cambios pendientes — sin aplicar"` + botones **Aplicar cambios** / **Descartar**
5. Al hacer clic en **Aplicar cambios**: se ejecuta `applyEdits()` y el indicador cambia a "N cambios aplicados"
6. Al hacer clic en **Descartar**: las ediciones se descartan sin modificar el documento

Solo puede haber un conjunto de ediciones pendientes a la vez (el más reciente).

### Indicador de advertencia

Si la IA recibió contexto del documento (`hadDocContext: true`) pero no generó ningún bloque `[EDICION]` (`hadEditBlock: false`) y no se aplicó ningún cambio (`editsApplied === 0`), se muestra:

> ⚠ La IA respondió sin generar ediciones directas. Intentá ser más específico.

---

## Streaming SSE

Las respuestas del backend llegan en tiempo real como eventos SSE. El cliente usa `axios` con `responseType: "text"` y `onDownloadProgress` para procesar el stream:

```
data: {"type": "start"}
data: {"type": "chunk", "text": "texto parcial"}
data: {"type": "chunk", "text": " más texto"}
data: {"type": "done", "metadata": {"model": "gpt-4o", "tokensUsed": 342}}
```

- Cada evento `chunk` acumula el texto y actualiza el mensaje del asistente en tiempo real
- Al completarse, se analiza el texto acumulado para detectar bloques `[EDICION]`
- El streaming puede cancelarse con el botón de stop (ícono cuadrado), que llama `controller.abort()`

---

## Archivos involucrados

| Archivo | Rol |
|---|---|
| `src/pages/herramientas/editor-poc/AiChatPanel.tsx` | Panel de chat + acciones rápidas + contexto |
| `src/pages/herramientas/editor-poc/SelectionBubble.tsx` | Bubble inline sobre selección de texto + interfaz CaseContext |
| `src/pages/documentos/document-editor/index.tsx` | Integra ambos componentes; construye y pasa `caseContext` |
| `src/utils/ragAxios.ts` | Instancia de axios preconfigurada para el backend RAG |

### Endpoint backend

`POST /rag/editor/chat`

**Body completo:**

```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "documentText": "...",
  "pdfUrl": "https://...",
  "movementText": "...",
  "systemPromptOverride": "...",
  "caseContext": {
    "representedParty": "actor",
    "representationType": "apoderado",
    "folderFuero": "Civil",
    "folderJuris": "CABA",
    "folderName": "Gómez c/ López s/ Daños",
    "actorName": "María Gómez",
    "demandadoName": "Carlos López"
  },
  "stream": true
}
```

Ver documentación completa de la API en `pjn-rag-api/docs/editor-ai.md`.

---

*Última actualización: 2026-03-23*
