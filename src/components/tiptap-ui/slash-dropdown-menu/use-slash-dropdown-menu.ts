"use client"

import { useCallback } from "react"
import type { Editor } from "@tiptap/react"

// --- Icons ---
import { CodeBlockIcon } from "@/components/tiptap-icons/code-block-icon"
import { HeadingOneIcon } from "@/components/tiptap-icons/heading-one-icon"
import { HeadingTwoIcon } from "@/components/tiptap-icons/heading-two-icon"
import { HeadingThreeIcon } from "@/components/tiptap-icons/heading-three-icon"
import { ImageIcon } from "@/components/tiptap-icons/image-icon"
import { ListIcon } from "@/components/tiptap-icons/list-icon"
import { ListOrderedIcon } from "@/components/tiptap-icons/list-ordered-icon"
import { BlockquoteIcon } from "@/components/tiptap-icons/blockquote-icon"
import { ListTodoIcon } from "@/components/tiptap-icons/list-todo-icon"
import { AiSparklesIcon } from "@/components/tiptap-icons/ai-sparkles-icon"
import { MinusIcon } from "@/components/tiptap-icons/minus-icon"
import { TypeIcon } from "@/components/tiptap-icons/type-icon"
import { AtSignIcon } from "@/components/tiptap-icons/at-sign-icon"
import { SmilePlusIcon } from "@/components/tiptap-icons/smile-plus-icon"
import { TableIcon } from "@/components/tiptap-icons/table-icon"
import { ListIndentedIcon } from "@/components/tiptap-icons/list-indented-icon"

// --- Lib ---
import {
  isExtensionAvailable,
  isNodeInSchema,
} from "@/lib/tiptap-utils"
import {
  findSelectionPosition,
  hasContentAbove,
} from "@/lib/tiptap-advanced-utils"

// --- Tiptap UI ---
import type { SuggestionItem } from "@/components/tiptap-ui-utils/suggestion-menu"
import { addEmojiTrigger } from "@/components/tiptap-ui/emoji-trigger-button"
import { addMentionTrigger } from "@/components/tiptap-ui/mention-trigger-button"

export interface SlashMenuConfig {
  enabledItems?: SlashMenuItemType[]
  customItems?: SuggestionItem[]
  itemGroups?: {
    [key in SlashMenuItemType]?: string
  }
  showGroups?: boolean
}

const texts = {
  // AI
  continue_writing: {
    title: "Continuar escritura",
    subtext: "Continuar desde la posición actual",
    keywords: ["continuar", "escribir", "ai", "ia"],
    badge: AiSparklesIcon,
    group: "IA",
  },
  ai_ask_button: {
    title: "Preguntar a la IA",
    subtext: "Generar contenido con IA",
    keywords: ["ia", "ai", "preguntar", "generar"],
    badge: AiSparklesIcon,
    group: "IA",
  },

  // Style
  text: {
    title: "Texto",
    subtext: "Párrafo de texto",
    keywords: ["p", "parrafo", "texto"],
    badge: TypeIcon,
    group: "Estilo",
  },
  heading_1: {
    title: "Título 1",
    subtext: "Encabezado principal",
    keywords: ["h1", "titulo", "encabezado"],
    badge: HeadingOneIcon,
    group: "Estilo",
  },
  heading_2: {
    title: "Título 2",
    subtext: "Encabezado de sección",
    keywords: ["h2", "titulo", "seccion"],
    badge: HeadingTwoIcon,
    group: "Estilo",
  },
  heading_3: {
    title: "Título 3",
    subtext: "Encabezado de subsección",
    keywords: ["h3", "titulo", "subseccion"],
    badge: HeadingThreeIcon,
    group: "Estilo",
  },
  bullet_list: {
    title: "Lista con viñetas",
    subtext: "Lista sin orden",
    keywords: ["lista", "vinetas", "ul"],
    badge: ListIcon,
    group: "Estilo",
  },
  ordered_list: {
    title: "Lista numerada",
    subtext: "Lista con orden numérico",
    keywords: ["lista", "numerada", "ol"],
    badge: ListOrderedIcon,
    group: "Estilo",
  },
  task_list: {
    title: "Lista de tareas",
    subtext: "Lista de tareas pendientes",
    keywords: ["tarea", "checklist", "pendiente"],
    badge: ListTodoIcon,
    group: "Estilo",
  },
  quote: {
    title: "Cita",
    subtext: "Bloque de cita",
    keywords: ["cita", "quote"],
    badge: BlockquoteIcon,
    group: "Estilo",
  },
  code_block: {
    title: "Bloque de código",
    subtext: "Código con resaltado de sintaxis",
    keywords: ["codigo", "code", "pre"],
    badge: CodeBlockIcon,
    group: "Estilo",
  },

  // Insert
  mention: {
    title: "Mención",
    subtext: "Mencionar un usuario o elemento",
    keywords: ["mencion", "usuario", "etiqueta"],
    badge: AtSignIcon,
    group: "Insertar",
  },
  emoji: {
    title: "Emoji",
    subtext: "Insertar un emoji",
    keywords: ["emoji", "emoticon"],
    badge: SmilePlusIcon,
    group: "Insertar",
  },
  table: {
    title: "Tabla",
    subtext: "Insertar una tabla",
    aliases: ["table", "insertTable"],
    badge: TableIcon,
    group: "Insertar",
  },
  divider: {
    title: "Separador",
    subtext: "Línea horizontal separadora",
    keywords: ["separador", "linea", "hr"],
    badge: MinusIcon,
    group: "Insertar",
  },
  toc: {
    title: "Tabla de contenidos",
    subtext: "Insertar índice de contenidos",
    keywords: ["toc", "indice", "contenidos"],
    badge: ListIndentedIcon,
    group: "Insertar",
  },

  // Upload
  image: {
    title: "Imagen",
    subtext: "Imagen redimensionable",
    keywords: ["imagen", "imagen", "cargar", "img", "foto", "media", "url"],
    badge: ImageIcon,
    group: "Cargar",
  },
}

export type SlashMenuItemType = keyof typeof texts

const getItemImplementations = () => {
  return {
    // AI
    continue_writing: {
      check: (editor: Editor) => {
        const { hasContent } = hasContentAbove(editor)
        const extensionsReady = isExtensionAvailable(editor, [
          "ai",
          "aiAdvanced",
        ])
        return extensionsReady && hasContent
      },
      action: ({ editor }: { editor: Editor }) => {
        const editorChain = editor.chain().focus()

        const nodeSelectionPosition = findSelectionPosition({ editor })

        if (nodeSelectionPosition !== null) {
          editorChain.setNodeSelection(nodeSelectionPosition)
        }

        editorChain.run()

        editor.chain().focus().aiGenerationShow().run()

        requestAnimationFrame(() => {
          const { hasContent, content } = hasContentAbove(editor)

          const snippet =
            content.length > 500 ? `...${content.slice(-500)}` : content

          const prompt = hasContent
            ? `Context: ${snippet}\n\nContinue writing from where the text above ends. Write ONLY ONE SENTENCE. DONT REPEAT THE TEXT.`
            : "Start writing a new paragraph. Write ONLY ONE SENTENCE."

          editor
            .chain()
            .focus()
            // @ts-ignore - ai extension not installed
            .aiTextPrompt({
              stream: true,
              format: "rich-text",
              text: prompt,
            })
            .run()
        })
      },
    },
    ai_ask_button: {
      check: (editor: Editor) =>
        isExtensionAvailable(editor, ["ai", "aiAdvanced"]),
      action: ({ editor }: { editor: Editor }) => {
        const editorChain = editor.chain().focus()

        const nodeSelectionPosition = findSelectionPosition({ editor })

        if (nodeSelectionPosition !== null) {
          editorChain.setNodeSelection(nodeSelectionPosition)
        }

        editorChain.run()

        editor.chain().focus().aiGenerationShow().run()
      },
    },

    // Style
    text: {
      check: (editor: Editor) => isNodeInSchema("paragraph", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().setParagraph().run()
      },
    },
    heading_1: {
      check: (editor: Editor) => isNodeInSchema("heading", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run()
      },
    },
    heading_2: {
      check: (editor: Editor) => isNodeInSchema("heading", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      },
    },
    heading_3: {
      check: (editor: Editor) => isNodeInSchema("heading", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run()
      },
    },
    bullet_list: {
      check: (editor: Editor) => isNodeInSchema("bulletList", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleBulletList().run()
      },
    },
    ordered_list: {
      check: (editor: Editor) => isNodeInSchema("orderedList", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleOrderedList().run()
      },
    },
    task_list: {
      check: (editor: Editor) => isNodeInSchema("taskList", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleTaskList().run()
      },
    },
    quote: {
      check: (editor: Editor) => isNodeInSchema("blockquote", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleBlockquote().run()
      },
    },
    code_block: {
      check: (editor: Editor) => isNodeInSchema("codeBlock", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleNode("codeBlock", "paragraph").run()
      },
    },

    // Insert
    mention: {
      check: (editor: Editor) =>
        isExtensionAvailable(editor, ["mention", "mentionAdvanced"]),
      action: ({ editor }: { editor: Editor }) => addMentionTrigger(editor),
    },
    emoji: {
      check: (editor: Editor) =>
        isExtensionAvailable(editor, ["emoji", "emojiPicker"]),
      action: ({ editor }: { editor: Editor }) => addEmojiTrigger(editor),
    },
    divider: {
      check: (editor: Editor) => isNodeInSchema("horizontalRule", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().setHorizontalRule().run()
      },
    },
    toc: {
      check: (editor: Editor) => isNodeInSchema("tocNode", editor),
      action: ({ editor }: { editor: Editor }) => {
        // @ts-ignore - toc extension not installed
        editor.chain().focus().insertTocNode().run()
      },
    },
    table: {
      check: (editor: Editor) => isNodeInSchema("table", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor
          .chain()
          .focus()
          .insertTable({
            rows: 3,
            cols: 3,
            withHeaderRow: false,
          })
          .run()
      },
    },

    // Upload
    image: {
      check: (editor: Editor) => isNodeInSchema("image", editor),
      action: ({ editor }: { editor: Editor }) => {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageUpload",
          })
          .run()
      },
    },
  }
}

function organizeItemsByGroups(
  items: SuggestionItem[],
  showGroups: boolean
): SuggestionItem[] {
  if (!showGroups) {
    return items.map((item) => ({ ...item, group: "" }))
  }

  const groups: { [groupLabel: string]: SuggestionItem[] } = {}

  // Group items
  items.forEach((item) => {
    const groupLabel = item.group || ""
    if (!groups[groupLabel]) {
      groups[groupLabel] = []
    }
    groups[groupLabel].push(item)
  })

  // Flatten groups in order (this maintains the visual order for keyboard navigation)
  const organizedItems: SuggestionItem[] = []
  Object.entries(groups).forEach(([, groupItems]) => {
    organizedItems.push(...groupItems)
  })

  return organizedItems
}

/**
 * Custom hook for slash dropdown menu functionality
 */
export function useSlashDropdownMenu(config?: SlashMenuConfig) {
  const getSlashMenuItems = useCallback(
    (editor: Editor) => {
      const items: SuggestionItem[] = []

      const enabledItems =
        config?.enabledItems || (Object.keys(texts) as SlashMenuItemType[])
      const showGroups = config?.showGroups !== false

      const itemImplementations = getItemImplementations()

      enabledItems.forEach((itemType) => {
        const itemImpl = itemImplementations[itemType]
        const itemText = texts[itemType]

        if (itemImpl && itemText && itemImpl.check(editor)) {
          const item: SuggestionItem = {
            onSelect: ({ editor }) => itemImpl.action({ editor }),
            ...itemText,
          }

          if (config?.itemGroups?.[itemType]) {
            item.group = config.itemGroups[itemType]
          } else if (!showGroups) {
            item.group = ""
          }

          items.push(item)
        }
      })

      if (config?.customItems) {
        items.push(...config.customItems)
      }

      // Reorganize items by groups to ensure keyboard navigation works correctly
      return organizeItemsByGroups(items, showGroups)
    },
    [config]
  )

  return {
    getSlashMenuItems,
    config,
  }
}
