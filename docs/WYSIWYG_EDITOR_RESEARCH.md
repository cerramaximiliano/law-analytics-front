# Investigación: Editores WYSIWYG con paginación tipo Word/Google Docs

**Fecha:** Marzo 2026
**Objetivo:** Evaluar CKEditor 5 y alternativas para implementar un editor de documentos con vista de impresión (páginas A4 físicas), merge fields dinámicos y exportación a PDF/Word.

---

## Contexto

El requerimiento es un editor WYSIWYG que:
- Muestre el documento dividido en páginas A4 visibles (como Google Docs / Word)
- Soporte campos dinámicos (merge fields) para documentos tipo plantilla
- Exporte a PDF y Word
- Tenga interfaz en español
- Se integre con React / TypeScript

---

## CKEditor 5

### Paginación — ⚠️ Limitada

**La paginación de CKEditor 5 NO replica la experiencia de Google Docs.**
No muestra páginas físicas blancas separadas — muestra *líneas divisorias* dentro de un flujo continuo que indican dónde se cortará al exportar.

Restricciones críticas:
- Solo funciona en **Chrome/Chromium** (no Firefox, no Safari)
- Solo disponible con **Decoupled Editor** (no con el Classic Editor)
- **Paginación es un add-on del plan Custom** (precio negociado) — no disponible en planes Essential ni Professional
- Headers y footers solo se configuran para el export; no se ven en el editor

### Precios

| Plan | Precio | Editor loads/mes | Notas |
|------|--------|-----------------|-------|
| Free | $0 | 1,000 | Con marca de agua. Si excede sin pago → editor en solo-lectura |
| Essential | $144/mes | 5,000 | Merge fields, templates, export PDF/Word, footnotes |
| Professional | $405/mes | 20,000 | + Track Changes, Comments, Import from Word, colaboración |
| Custom | A negociar | Ilimitado | + Paginación visual, soporte enterprise |

> Los exports a PDF/Word son un **servicio cloud** (documentos enviados a servidores de CKEditor). No es self-hosted en planes bajos.

### Merge Fields / Campos dinámicos — ✅ Excelente

El punto más fuerte para documentos legales:

- **Campos de texto inline**: `{{nombre}}`, `{{fecha}}`, etc. con soporte de bold, links y estilos
- **Campos de bloque**: para cláusulas o párrafos completos, con altura configurable
- **Campos de imagen**: para logos o firmas digitales
- Sintaxis personalizable (no tiene que ser `{{}}`, se pueden usar otros delimitadores)
- Tres modos de preview: labels / valores por defecto / dataset real
- Obtener HTML con valores reemplazados:
  ```js
  editor.getData({ mergeFieldsData: { nombre: "Juan Pérez", fecha: "16/03/2026" } })
  ```
- **Export a Word**: genera `.docx` con merge fields nativos de Word (compatible con Mail Merge)
- **Import from Word**: reconoce merge fields de documentos `.docx` importados

### Español — ✅

Traducción profesional completa (menús, tooltips, diálogos):
```ts
import translations from 'ckeditor5/translations/es.js';
// config: { translations: [translations] }
```

### Integración React / TypeScript — ✅

- Paquete oficial: `@ckeditor/ckeditor5-react`
- Escrito en TypeScript — tipos nativos incluidos, sin `@types/*` adicional
- Modelo de instalación modular desde npm (a partir de abril 2025, no más pre-built builds)

### Funcionalidades relevantes para documentos legales

| Feature | Plan mínimo |
|---------|-------------|
| Merge Fields + Templates | Essential ($144/mes) |
| Export a PDF y Word (cloud) | Essential ($144/mes) |
| Footnotes (notas al pie) | Essential ($144/mes) |
| Table of Contents automático | Essential ($144/mes) |
| Document Outline (panel lateral) | Essential ($144/mes) |
| Find & Replace avanzado | Essential ($144/mes) |
| Import desde Word (.docx) | Professional ($405/mes) |
| Track Changes | Professional ($405/mes) |
| Comments (comentarios inline) | Professional ($405/mes) |
| Revision History | Professional ($405/mes) |
| Colaboración en tiempo real | Professional ($405/mes) |
| Restricted Editing (zonas protegidas) | Gratuito (GPL) |
| Paginación visual | Custom (add-on) |
| Spell & Grammar Checker | Add-on separado |

---

## Alternativas evaluadas

### Syncfusion Document Editor — ⭐ Recomendado si la paginación es prioritaria

- **Licencia:** Gratuita para proyectos con menos de $1M USD de ingresos anuales y hasta 5 devs. Luego comercial.
- **Paginación:** Real, con páginas físicas A4, headers/footers y numeración de páginas — el más fiel a Word en el browser
- **Import/Export DOCX:** Local (no cloud), motor propio
- **Incluye:** Track Changes, Comments, Table of Contents, Bookmarks
- **React:** Componente oficial `@syncfusion/ej2-react-documenteditor`
- **Merge Fields:** Soporte básico (menos avanzado que CKEditor)
- **Español:** Soportado

### TipTap + Pages — Prometedor pero en Alpha

- **Core:** MIT gratuito. Pages es premium (planes Team/Business, precio custom)
- **Paginación:** Real — páginas A4, A3, Letter, márgenes configurables, headers/footers dinámicos con números de página
- **Estado actual:** **Alpha** — no recomendado para producción aún
- **Merge Fields, Templates, Collaboration** disponibles como extensions premium
- **React:** Framework-agnostic con paquetes React oficiales
- Candidato a evaluar cuando salga de Alpha

### Otras opciones (sin paginación nativa)

| Editor | Paginación | Licencia | Notas |
|--------|-----------|----------|-------|
| ProseMirror | ❌ Manual/complejo | MIT | Base de TipTap y Plate — demasiado bajo nivel |
| Plate.js | ❌ No | MIT | Orientado a Notion, no a documentos A4 |
| Lexical (Meta) | ❌ No | MIT | Excelente React-first pero sin páginas |
| Quill | ❌ No | BSD-3 | Menos mantenido activamente |
| BlockNote | ❌ No | MPL-2.0 | Estilo Notion, sin páginas físicas |

---

## Comparativa final

| | CKEditor 5 | Syncfusion | TipTap Pages |
|--|--|--|--|
| **Páginas físicas A4** | ❌ Solo líneas divisorias | ✅ Real | ✅ Real (Alpha) |
| **Merge Fields** | ✅ Excelente | ⚠️ Básico | ✅ Bueno |
| **Export PDF/Word** | ✅ Cloud (Essential+) | ✅ Local | ⚠️ Premium |
| **Import from Word** | ✅ Professional+ | ✅ Incluido | ⚠️ Premium |
| **Track Changes** | ✅ Professional+ | ✅ Incluido | ⚠️ Premium |
| **Español** | ✅ | ✅ | ✅ |
| **React / TypeScript** | ✅ Oficial | ✅ Oficial | ✅ Oficial |
| **Precio mínimo útil** | $144/mes (sin paginación) | Gratis hasta $1M ARR | Custom |
| **Listo para producción** | ✅ | ✅ | ❌ Alpha |

---

## Recomendación

### Si la paginación tipo Word es el requisito principal
→ **Syncfusion Document Editor** es la opción más pragmática hoy:
- Gratis para la escala actual de Law Analytics
- Paginación real con páginas físicas (la experiencia más cercana a Word en el browser)
- Import/Export DOCX sin depender de servicios cloud externos
- Track Changes y Comments incluidos sin costo adicional

### Si priorizás Merge Fields avanzados y Templates
→ **CKEditor 5 Essential ($144/mes)** cubre bien el caso de uso de plantillas con campos dinámicos, con la salvedad de que la "paginación" es solo indicativa (líneas) y exclusiva de Chrome.

### A futuro
→ **TipTap Pages** cuando salga de Alpha podría ser la mejor combinación de ambos mundos (paginación real + merge fields + open source en core).

---

## Próximos pasos sugeridos

1. **Probar Syncfusion** con un componente de ejemplo para validar la experiencia de paginación A4 y la integración con el stack actual
2. **Prototipar CKEditor 5 Essential** (14 días de trial gratuito) para validar los merge fields con las plantillas existentes en el sistema
3. Tomar decisión basada en el resultado visual de ambas pruebas

---

## Integración de RAG + IA/LLM en el editor

### Concepto general

La idea es tener un asistente de IA dentro del editor que:
- Genere o complete texto legalmente adecuado según el tipo de documento
- Use documentos propios del usuario como contexto (RAG sobre expedientes y contratos previos)
- Rellene merge fields automáticamente desde los datos del caso
- Haga revisión legal del documento
- Todo esto sin salir del editor, con streaming en tiempo real

### Soporte de IA por editor

#### CKEditor 5 — AI Assistant (plugin oficial)

- UI integrada en la toolbar (menú desplegable de comandos predefinidos + query libre)
- Streaming nativo
- **Custom endpoint:** Se puede apuntar a un proxy propio en lugar del servicio de CKEditor
- **RAG:** Implementable sobreescribiendo `prepareMessages()` para inyectar contexto antes de llamar al LLM
- **Limitación:** Solo extiende adapters de OpenAI/Azure/Bedrock — para Anthropic o modelo custom hay que hacer más trabajo
- **Requiere plan premium** (cotización, no hay precio público)

```js
// Override para inyectar contexto RAG
class LegalAIAdapter extends OpenAITextAdapter {
  async prepareMessages(query, context, actionId) {
    const messages = await super.prepareMessages(query, context, actionId);
    const ragContext = await fetch('/api/rag?query=' + query).then(r => r.json());
    messages[0].content += '\n\nDocumentos relevantes:\n' + ragContext.documents;
    return messages;
  }
}
```

#### TipTap — AI Toolkit (add-on premium, Beta)

El más flexible y el más alineado con el stack existente de Law Analytics:

- Permite construir **agentes de IA** que leen y modifican el documento via tool calling
- Tools disponibles: `tiptapRead()`, `tiptapEdit()`, `tiptapReadSelection()`, `getThreads()`
- Compatible con Vercel AI SDK, LangChain.js, OpenAI function calling, Anthropic tool use
- **Custom backend nativo:** Sin pasar por Tiptap Cloud — el backend tiene control total
- **RAG:** Completamente soportado en el backend propio antes de llamar al LLM
- Streaming en tiempo real chunk por chunk en el editor
- Multi-documento: puede operar sobre varios documentos a la vez

#### Syncfusion — Integración custom (sin plugin oficial)

- No tiene plugin de IA nativo — se construye una capa adicional usando la API pública del editor
- La inserción de contenido requiere conversión HTML → SFDT (formato nativo Syncfusion)
- No tiene streaming nativo del texto generado en el editor
- Compatible con cualquier LLM vía Vercel AI SDK apuntando a un endpoint custom
- Más trabajo de integración, pero gratis (no hay costo adicional de Syncfusion para la IA)

### Arquitectura recomendada para Law Analytics

Law Analytics ya tiene `pjn-rag-api`, `pjn-rag-workers` (Pinecone + OpenAI embeddings) y `law-analytics-server` como hub. La integración natural sería:

```
Editor WYSIWYG (React)
    │  Bubble menu / Slash commands / Sidebar AI
    │  SSE streaming
    ▼
law-analytics-server  /api/ai/generate
    ├── 1. Autenticar JWT
    ├── 2. Extraer: query + selección + metadatos del caso
    ├── 3. Embedding de la query → buscar en Pinecone
    ├── 4. Recuperar chunks de documentos relevantes del usuario
    ├── 5. Construir prompt: contexto RAG + datos del expediente
    ├── 6. Llamar OpenAI / Anthropic (stream)
    └── 7. SSE → frontend → insertar en editor

Pinecone (documentos indexados)           OpenAI / Anthropic
  - Contratos del usuario                   - gpt-4o
  - Escritos anteriores                     - claude-3.5-sonnet
  - Sentencias relevantes
```

**Payload al backend (ejemplo):**
```typescript
{
  query: "Redactar cláusula de confidencialidad",
  selectedText: "...",             // texto seleccionado en el editor
  documentType: "contrato",
  caseMetadata: {
    expediente: "12345/2024",
    partes: { actora: "Juan García", demandada: "Empresa SA" },
    fuero: "civil",
    tribunal: "Juzgado Civil N°3"
  },
  mergeFields: { ... }            // campos disponibles en el template
}
```

### Casos de uso concretos para documentos legales

| Caso de uso | Trigger en el editor | Backend |
|-------------|---------------------|---------|
| **Generar cláusula** | `/clausula [tipo]` o selección + "Generar" | RAG sobre contratos similares + LLM |
| **Autocompletar** | Tab al final de una oración | RAG con documentos del usuario |
| **Rellenar merge fields** | Botón "Completar con IA" | Datos del caso → LLM mapea a campos |
| **Revisión legal** | Botón en toolbar | Documento completo → LLM analiza + destaca issues |
| **Mejorar redacción** | Selección + "Mejorar" | Selección + contexto de tipo de doc → LLM |
| **Resumir sección** | Selección + "Resumir" | Solo la selección → LLM |
| **Traducir** | Selección + "Traducir" | Selección → LLM |
| **Generar petitorio** | `/petitorio` | Hechos del documento + RAG → LLM genera sección |

### Seguridad (importante para documentos legales)

- **Nunca** exponer API keys de LLM en el frontend — siempre via proxy backend
- Autenticar con JWT de `law-analytics-server` en cada request de IA
- Filtrar en Pinecone por `userId` — cada usuario solo accede a sus documentos
- Enviar al LLM solo la selección o chunk relevante, no el documento completo cuando sea posible
- Loguear todas las queries de IA para auditoría
- Considerar Azure OpenAI si se requieren garantías de residencia de datos (DPA)

### Comparativa de enfoques de integración IA

| Aspecto | CKEditor AI Plugin | TipTap AI Toolkit | Custom (Novel.sh pattern) |
|---------|-------------------|-------------------|--------------------------|
| Setup | Bajo | Medio | Alto |
| UI incluida | ✅ Pulida | ❌ Construir | ❌ Construir |
| RAG custom | ⚠️ Via override | ✅ Total control | ✅ Total control |
| Streaming | ✅ Nativo | ✅ Nativo | ✅ Con SSE/Vercel AI SDK |
| Flexibilidad | Media | Alta | Máxima |
| Control de datos | Medio | Total (custom backend) | Total |
| Costo | $$$ (plan premium) | $$ (add-on) | $ (solo LLM) |
| Mantenimiento | Bajo | Medio | Alto |

### Recomendación para Law Analytics

Dado que ya existe `pjn-rag-api` con Pinecone y el stack completo:

**Opción preferida: TipTap + backend RAG propio**
- Conecta directamente a `law-analytics-server` como proxy de IA
- Reutiliza la infraestructura RAG de `pjn-rag-api`
- Control total sobre qué datos se envían al LLM
- La API de TipTap es la más ergonómica para insertar contenido generado en React/TypeScript
- Patrón de referencia open source: [Novel.sh](https://github.com/steven-tey/novel)

**Opción alternativa si se elige CKEditor 5:**
- Usar el AI Assistant oficial con proxy endpoint propio
- Inyectar contexto RAG via `prepareMessages()` override
- Menor trabajo de UI pero menos flexibilidad y más costoso
