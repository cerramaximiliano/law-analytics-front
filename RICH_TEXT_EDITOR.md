# Editor de Documentos Rich Text — Documentación técnica

**Fecha:** 2026-03-17
**Estado:** Implementado — pendiente de restart de servidores para activar

---

## Descripción general

Sistema completo de creación y gestión de documentos jurídicos con editor de texto enriquecido (TipTap v3), plantillas reutilizables con campos dinámicos (merge fields), resolución automática de datos desde expedientes y contactos, y asistente de IA para redacción.

---

## Arquitectura

```
/documentos/modelos          → Lista de plantillas (Mis Modelos)
/documentos/modelos/nuevo    → Editor de nueva plantilla
/documentos/modelos/:id/editar → Editor de plantilla existente

/documentos/escritos         → Lista de documentos generados
/documentos/escritos/nuevo   → Editor de nuevo documento (desde plantilla)
/documentos/escritos/:id/editar → Editor de documento existente
```

---

## Archivos creados / modificados

### Frontend — `law-analytics-front`

#### Tipos
| Archivo | Descripción |
|---|---|
| `src/types/rich-text-document.ts` | Interfaces `RichTextTemplate`, `RichTextDocument`, payloads y params |

#### Redux
| Archivo | Descripción |
|---|---|
| `src/store/reducers/richTextDocuments.ts` | Reducer + thunks para templates y documentos. URLs: `/api/rich-text-templates` y `/api/rich-text-documents` |
| `src/store/reducers/index.ts` | Registrado como `richTextDocumentsReducer` |

#### Páginas
| Archivo | Ruta | Descripción |
|---|---|---|
| `src/pages/herramientas/editor-poc/index.tsx` | `/herramientas/editor-poc` | Sandbox de desarrollo del editor TipTap |
| `src/pages/herramientas/plantillas/index.tsx` | `/documentos/modelos` | Lista de plantillas. Tab 0: PDFs del sistema. Tab 1: Mis Modelos (rich text). Soporta `?tab=1` para activar el tab correcto al navegar desde el editor |
| `src/pages/documentos/template-editor/index.tsx` | `/documentos/modelos/nuevo` y `/:id/editar` | Editor de plantillas con todos los campos del header, TipTap A4, panel de merge fields, panel de IA |
| `src/pages/documentos/document-editor/index.tsx` | `/documentos/escritos/nuevo` y `/:id/editar` | Editor de documentos. Soporta creación desde plantilla (`?templateId=xxx`) y edición de documentos existentes. Incluye resolución de merge fields con selectores de expediente/cliente/contraparte |
| `src/pages/documentos/escritos/index.tsx` | `/documentos/escritos` | Lista paginada de documentos generados con búsqueda, filtro por estado, acciones editar/eliminar |

#### Componentes del editor (compartidos por los 3 editores)
| Archivo | Descripción |
|---|---|
| `src/pages/herramientas/editor-poc/editor.css` | Estilos: contenedor A4, sombra de página, `.merge-field` chip azul |
| `src/pages/herramientas/editor-poc/EditorToolbar.tsx` | Toolbar con: deshacer/rehacer, estilo de párrafo, tamaño de fuente, negrita/cursiva/subrayado/tachado, color de texto (paleta + picker), alineación, interlineado, lista con viñetas, lista numerada |
| `src/pages/herramientas/editor-poc/MergeFieldsPanel.tsx` | Panel lateral derecho con búsqueda y grupos de campos dinámicos |
| `src/pages/herramientas/editor-poc/AiChatPanel.tsx` | Panel lateral de chat IA. SSE streaming via `fetch`. Toggle "Incluir documento como contexto". Prompts sugeridos. Bloques de código con botones "Insertar al cursor" y "Copiar" |
| `src/pages/herramientas/editor-poc/mergeFieldsDefs.ts` | Definición de los 25 campos dinámicos en 5 grupos: Cliente, Expediente, Contraparte, Letrado, Fechas |

#### Extensiones TipTap
| Archivo | Descripción |
|---|---|
| `extensions/MergeFieldExtension.ts` | Nodo inline atómico `{{campo}}` — no editable, seleccionable como unidad |
| `extensions/TabIndentExtension.ts` | Tab inserta `\t` (2cm en editor y PDF) |
| `extensions/FontSizeExtension.ts` | Tamaño de fuente via atributo de `TextStyle` |
| `extensions/LineHeightExtension.ts` | Interlineado via atributo de párrafo/heading |

#### Rutas
| Archivo | Cambios |
|---|---|
| `src/routes/MainRoutes.tsx` | Rutas agregadas: `/documentos/modelos/nuevo`, `/documentos/modelos/:id/editar`, `/documentos/escritos` (→ EscritosPage), `/documentos/escritos/nuevo`, `/documentos/escritos/:id/editar` |
| `src/menu-items/documentos.tsx` | Sin cambios — ya tenía los links correctos |

#### Dependencias npm instaladas
```
tiptap-pagination-plus    ^3.0.5   — paginación visual A4
@tiptap/extension-color   ^3.20.4  — color de texto
date-fns                  ^2.30.0  — requerido por @mui/x-date-pickers v6
moment                    (latest) — requerido por calculadora laboral
```

---

### Backend — `law-analytics-server`

#### Modelos Mongoose
| Archivo | Colección | Campos clave |
|---|---|---|
| `models/RichTextTemplate.js` | `rich_text_templates` | `userId, name, description, category, content (Mixed/TipTap JSON), mergeFields[], isPublic, isActive, source (system\|user)` |
| `models/RichTextDocument.js` | `rich_text_documents` | `userId, templateId, templateName, templateCategory, title, content (Mixed), formData (Mixed), status (draft\|final), linkedFolderId, linkedContactId, tags[]` |

#### Controllers
| Archivo | Endpoints |
|---|---|
| `controllers/richTextTemplatesController.js` | `getTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate` |
| `controllers/richTextDocumentsController.js` | `getDocuments, getDocument, createDocument, updateDocument, deleteDocument, resolveFields` |

#### `resolveFields` — lógica de resolución de campos dinámicos
`POST /api/rich-text-documents/resolve-fields`
Body: `{ folderId?, contactId?, contraparteId? }`
Retorna: `{ resolvedFields: { "cliente.nombre": "...", "expediente.numero": "...", ... } }`

Fuentes de datos:
- **Letrado**: del usuario autenticado (`user.firstName`, `user.lastName`, `user.skill[0].registrationNumber`)
- **Expediente**: `folder.folderName` (carátula), `folder.judFolder.numberJudFolder`, `courtNumber`, `secretaryNumber`, `statusJudFolder`, `jurisdiccion`
- **Cliente**: `contact.name`, `lastName`, `document`, `cuit`, `address`, `email`, `phone`
- **Contraparte**: igual que cliente + `contact.company`
- **Fechas**: `fecha.hoy` (DD/MM/YYYY), `fecha.hoy_largo` (D de mes de YYYY)

#### Rutas
| Archivo | Base URL |
|---|---|
| `routes/richTextTemplatesRoutes.js` | `/api/rich-text-templates` |
| `routes/richTextDocumentsRoutes.js` | `/api/rich-text-documents` — nota: `resolve-fields` va antes de `/:id` |
| `routes/index.js` | Registradas al final junto a las rutas de postal |

---

### Backend — `pjn-rag-api`

#### Ruta de IA para el editor
| Archivo | Endpoint | Descripción |
|---|---|---|
| `src/routes/editor.routes.js` | `POST /rag/editor/chat` | Asistente de redacción jurídica. SSE streaming. Usa `generateStreamingResponse` de `pjn-rag-shared` directamente — sin Pinecone/RAG |
| `src/app.js` | `app.use('/rag/editor', editorRoutes)` | Registro de la ruta |

**Por qué `pjn-rag-api` y no `law-analytics-server`:**
El paquete `openai` no estaba instalado en el servidor principal. `pjn-rag-api` usa `generateStreamingResponse` de `pjn-rag-shared` que ya tiene OpenAI configurado, SSE implementado, y el proxy `/rag/*` de `law-analytics-server` ya redirige el tráfico correctamente.

**System prompt:** Asistente jurídico argentino, voseo, sugiere texto en triple backtick para insertar, no inventa citas.
**Modelo:** configurado por `OPENAI_EDITOR_MODEL` env var (default: `gpt-4o-mini`).
**Rate limit:** 40 requests/minuto por usuario.

---

## Flujo de uso completo

### Crear y usar una plantilla

```
1. /documentos/modelos → Tab "Mis Modelos" → "Crear modelo"
2. /documentos/modelos/nuevo → escribir contenido + insertar campos dinámicos del panel derecho
3. Guardar → vuelve a la lista con el modelo creado
4. Click "Crear documento" en la tarjeta del modelo
5. /documentos/escritos/nuevo?templateId=xxx → seleccionar expediente/cliente → "Resolver campos"
   → los nodos {{campo}} se reemplazan con datos reales
6. Editar manualmente si es necesario → "Guardar documento"
7. /documentos/escritos → lista de documentos con acciones
```

### Usar el asistente de IA
```
1. En cualquier editor → click en el ícono ✨ (MagicStar) del header
2. Panel lateral se abre a la derecha del panel de merge fields
3. Opcional: activar "Incluir documento como contexto"
4. Escribir consulta o usar prompts sugeridos
5. Respuestas con texto entre triple backtick → botones "Insertar al cursor" y "Copiar"
```

---

## Configuración de paginación A4 (editor)

```typescript
// 96 DPI — tamaños en píxeles
pageHeight:  1123  // 297mm
pageWidth:   794   // 210mm
marginTop:   95    // 25mm
marginBottom:95    // 25mm
marginLeft:  113   // 30mm (encuadernación)
marginRight: 95    // 25mm
```

## Export PDF (todos los editores)

Técnica: iframe oculto + `setTimeout(500ms)` para garantizar render antes de imprimir.

```typescript
const normalizeHtmlForPrint = (html) =>
  html.replace(/<p><\/p>/g, "<p><br></p>")
      .replace(/\t/g, '<span style="display:inline-block;width:2cm"></span>');
```

La pestaña `\t` se convierte a span de 2cm porque los browsers colapsan tabs en HTML.
`@page { size: A4; margin: 25mm 25mm 25mm 30mm; }` — los márgenes van en `@page`, no en el contenedor.

---

## Pendiente de verificación (post-restart)

| Item | Cómo verificar |
|---|---|
| Rutas del backend (`/api/rich-text-*`) | `POST /api/rich-text-templates` desde Postman o el editor |
| Resolución de merge fields | Crear plantilla con `{{cliente.nombre}}`, generar documento vinculando un contacto, hacer "Resolver campos" |
| Panel de IA — SSE a través del proxy | Abrir el panel IA en el editor y enviar un mensaje. Si los chunks llegan todos juntos al final (en vez de streameados), el proxy está bufereando |
| Proxy SSE en producción con nginx | Si hay buffering: agregar `proxy_buffering off;` y `X-Accel-Buffering: no` en la config de nginx para la ruta `/rag/editor/chat` |
| Color de texto en PDF export | Verificar que los colores inline del editor se preserven en la impresión |
| Font size en PDF export | Los atributos `font-size: Xpt` se incluyen como style inline en el HTML — deberían preservarse |

---

## Mejoras futuras identificadas

### Alta prioridad
| Mejora | Descripción |
|---|---|
| **Documentos en detalle de expediente** | Mostrar los `RichTextDocument` vinculados (`linkedFolderId`) en el tab de la carpeta correspondiente |
| **Eliminar/ocultar `/herramientas/editor-poc`** | Ahora que los editores reales existen, la ruta POC es redundante para el usuario final |

### Media prioridad
| Mejora | Descripción |
|---|---|
| **Historial del chat IA** | Actualmente el chat no persiste entre sesiones. Agregar modelo de conversación (`EditorConversation`) en `pjn-rag-api` similar a `ChatConversation` |
| **Exportar a DOCX** | Usar `html-docx-js` o similar para exportar el contenido del editor a formato Word |
| **Plantillas del sistema** | Cargar plantillas con `source: "system"` en la base de datos — visibles en Tab 0 de `/documentos/modelos` pero no editables por el usuario |
| **Previsualización de documento** | Vista de solo lectura del documento (sin toolbar ni panel) para compartir o imprimir directamente |
| **Tags en documentos** | Implementar UI para el campo `tags[]` que ya existe en el modelo backend |

### Baja prioridad
| Mejora | Descripción |
|---|---|
| **Ordenar lista numerada correctamente** | El icono `MenuBoard` usado para lista ordenada es un placeholder. Cuando haya un icono apropiado en iconsax, reemplazarlo |
| **Campos dinámicos personalizados** | Permitir que el usuario agregue campos propios más allá de los 25 predefinidos |
| **Auto-guardado** | Guardar el borrador automáticamente cada N segundos con `updateRichTextDocument` |
| **Modo colaborativo** | TipTap soporta colaboración en tiempo real con Y.js — requiere infraestructura adicional |

---

## Comandos de restart

```bash
# law-analytics-server
cd /home/mcerra/www/law-analytics-server
pm2 restart law-analytics-server   # o el nombre que tenga en PM2

# pjn-rag-api
cd /home/mcerra/www/pjn-rag-api
pm2 restart pjn-rag-api
```
