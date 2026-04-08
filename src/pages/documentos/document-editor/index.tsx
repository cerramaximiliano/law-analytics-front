import "../../../pages/herramientas/editor-poc/editor.css";
import "../../../styles/_variables.scss";
import "../../../styles/_keyframe-animations.scss";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Drawer,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { ArrowLeft2, CloseCircle, DocumentText, MagicStar, Refresh, Save2, Setting4, Warning2 } from "iconsax-react";
import AiSparklesIcon from "components/icons/AiSparklesIcon";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { PaginationPlus } from "tiptap-pagination-plus";
import { useDispatch, useSelector } from "store";
import {
	getRichTextTemplate,
	getRichTextDocument,
	createRichTextDocument,
	updateRichTextDocument,
	resolveRichTextFields,
} from "store/reducers/richTextDocuments";
import { getCalculatorsByUserId } from "store/reducers/calculator";
import { CalculatorType } from "types/calculator";
import { getFoldersByUserId } from "store/reducers/folder";
import { getContactsByUserId } from "store/reducers/contacts";
import { getMovementsByFolderId } from "store/reducers/movements";
import { Movement } from "types/movements";
import { openSnackbar } from "store/reducers/snackbar";
import ApiService from "store/reducers/ApiService";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import MainCard from "components/MainCard";
import EditorToolbar from "pages/herramientas/editor-poc/EditorToolbar";
import MergeFieldsPanel from "pages/herramientas/editor-poc/MergeFieldsPanel";
import AiChatPanel from "pages/herramientas/editor-poc/AiChatPanel";
import MergeFieldExtension from "pages/herramientas/editor-poc/extensions/MergeFieldExtension";
import TabIndentExtension from "pages/herramientas/editor-poc/extensions/TabIndentExtension";
import SelectionBubble, { type CaseContext } from "pages/herramientas/editor-poc/SelectionBubble";
import DiffReviewPanel, { type PendingDiff } from "pages/herramientas/editor-poc/DiffReviewPanel";
import { Fragment } from "prosemirror-model";
import { wordDiff, insertDiffWithoutHistory } from "pages/herramientas/editor-poc/diffUtils";
import FontSizeExtension from "pages/herramientas/editor-poc/extensions/FontSizeExtension";
import LineHeightExtension from "pages/herramientas/editor-poc/extensions/LineHeightExtension";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import axios from "axios";
import ragAxios from "utils/ragAxios";
import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import { RichTextDocumentStatus } from "types/rich-text-document";
import { UiState } from "components/tiptap-extension/ui-state-extension";
import { DragContextMenu } from "components/tiptap-ui/drag-context-menu";
import { SlashDropdownMenu } from "components/tiptap-ui/slash-dropdown-menu";
import { MERGE_FIELD_GROUPS } from "pages/herramientas/editor-poc/mergeFieldsDefs";
import type { SlashMenuConfig } from "components/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu";

// ==============================|| DOCUMENT EDITOR ||============================== //

/** Retorna el nombre de display de un contacto según su tipo:
 *  - Persona humana: nombre + apellido
 *  - Persona jurídica: razón social (company), o name como fallback
 */
function getContactDisplayName(contact: Contact): string {
	const isJuridica = contact.type?.toLowerCase().includes("jurídica");
	if (isJuridica) {
		return contact.company || contact.name || "";
	}
	return [contact.name, contact.lastName !== "-" ? contact.lastName : ""].filter(Boolean).join(" ");
}

const A4_CONFIG = {
	pageHeight: 1123,
	pageWidth: 794,
	marginTop: 95,
	marginBottom: 95,
	marginLeft: 113,
	marginRight: 95,
	pageGap: 32,
	pageGapBorderSize: 1,
	pageGapBorderColor: "#c8c8c8",
	pageBreakBackground: "#f0f0f0",
	footerRight: "",
	footerLeft: "",
	headerRight: "",
	headerLeft: "",
};

const PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
  p { margin: 0 0 0.5em; min-height: 1em; }
  h1 { font-size: 18pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  h2 { font-size: 14pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  h3 { font-size: 12pt; font-weight: bold; margin: 0.8em 0 0.4em; }
  ul, ol { padding-left: 1.5em; margin: 0 0 0.5em; }
  blockquote { border-left: 3px solid #ccc; margin: 0.5em 0; padding-left: 1em; color: #555; }
  .merge-field { background: none; border: none; color: inherit; font-family: inherit; font-size: inherit; font-weight: inherit; padding: 0; }
  @page { size: A4; margin: 25mm 25mm 25mm 30mm; }
`;

const normalizeHtmlForPrint = (html: string) =>
	html
		.replace(/<p><\/p>/g, "<p><br></p>")
		.replace(/\t/g, '<span style="display:inline-block;width:2cm"></span>');

/** Reemplaza nodos mergeField con texto resuelto. Si la clave no está en el mapa, conserva el nodo mergeField intacto. */
function resolveMergeFieldsInJson(
	node: Record<string, unknown>,
	resolved: Record<string, string>
): Record<string, unknown> | Record<string, unknown>[] {
	if (node.type === "mergeField") {
		const key = (node.attrs as Record<string, string>)?.key ?? "";
		if (resolved[key] !== undefined) {
			const text = resolved[key];
			// Si el texto tiene saltos de línea, generar nodos text + hardBreak
			if (text.includes("\n")) {
				const nodes: Record<string, unknown>[] = [];
				text.split("\n").forEach((line, i, arr) => {
					if (line) nodes.push({ type: "text", text: line });
					if (i < arr.length - 1) nodes.push({ type: "hardBreak" });
				});
				return nodes;
			}
			return { type: "text", text };
		}
		return node; // mantiene el nodo mergeField para que countPendingFields lo detecte
	}
	if (Array.isArray(node.content)) {
		return {
			...node,
			content: (node.content as Record<string, unknown>[]).flatMap((child) => {
				const result = resolveMergeFieldsInJson(child, resolved);
				return Array.isArray(result) ? result : [result];
			}),
		};
	}
	return node;
}

/** Cuenta cuántos mergeField quedan sin resolver en el JSON */
function countPendingFields(node: Record<string, unknown>): number {
	if (node.type === "mergeField") return 1;
	if (Array.isArray(node.content)) {
		return (node.content as Record<string, unknown>[]).reduce(
			(acc, child) => acc + countPendingFields(child),
			0
		);
	}
	return 0;
}

// Ícono para merge fields en el slash menu
const MergeFieldIcon = ({ className }: { className?: string }) => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
		<path d="M8 3C6.34315 3 5 4.34315 5 6V9C5 10.1046 4.10457 11 3 11V13C4.10457 13 5 13.8954 5 15V18C5 19.6569 6.34315 21 8 21V19C7.44772 19 7 18.5523 7 18V15C7 13.8954 6.10457 13 5.76 12.5L5.5 12L5.76 11.5C6.10457 11 7 10.1046 7 9V6C7 5.44772 7.44772 5 8 5V3Z M16 3V5C16.5523 5 17 5.44772 17 6V9C17 10.1046 17.8954 11 18.24 11.5L18.5 12L18.24 12.5C17.8954 13 17 13.8954 17 15V18C17 18.5523 16.5523 19 16 19V21C17.6569 21 19 19.6569 19 18V15C19 13.8954 19.8954 13 21 13V11C19.8954 11 19 10.1046 19 9V6C19 4.34315 17.6569 3 16 3Z"/>
	</svg>
);

// Config del slash menu: ítems de formato básico + todos los merge fields del proyecto
const SLASH_MENU_CONFIG: SlashMenuConfig = {
	enabledItems: ["heading_1", "heading_2", "heading_3", "text", "bullet_list", "ordered_list", "quote", "divider"],
	showGroups: true,
	customItems: MERGE_FIELD_GROUPS.flatMap((group) =>
		group.fields.map((field) => ({
			title: field.label,
			group: group.title,
			keywords: [field.key, field.key.split(".")[1], ...field.label.toLowerCase().split(" ")],
			badge: MergeFieldIcon,
			onSelect: ({ editor }: { editor: any }) => {
				editor.commands.insertMergeField(field.key, field.label);
			},
		}))
	),
};

const DocumentEditorPage = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const { id: documentId } = useParams<{ id: string }>();
	const templateId = searchParams.get("templateId");
	const isEdit = Boolean(documentId);

	const userId = useSelector((state: any) => state.auth?.user?._id);
	const userSkills: any[] = useSelector((state: any) => {
		const skills = state.auth?.user?.skill || [];
		return Array.isArray(skills) ? skills.filter((s: any) => typeof s === "object" && s?.name) : [];
	});
	const allFolders: FolderData[] = useSelector((state: any) => state.folder?.folders || []);
	const allContacts: Contact[] = useSelector((state: any) => state.contacts?.contacts || []);
	const allCalculators: CalculatorType[] = useSelector((state: any) => state.calculator?.calculators || []);

	const [title, setTitle] = useState("");
	const [status, setStatus] = useState<RichTextDocumentStatus>("draft");
	const [selectedFolder, setSelectedFolder] = useState<FolderData | null>(null);
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [selectedContraparte, setSelectedContraparte] = useState<Contact | null>(null);
	const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType | null>(null);
	const [selectedSkill, setSelectedSkill] = useState<any | null>(null);
	const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
	const [folderMovements, setFolderMovements] = useState<Movement[]>([]);
	const [movementsPage, setMovementsPage] = useState(1);
	const [movementsTotal, setMovementsTotal] = useState(0);
	const [movementsLoading, setMovementsLoading] = useState(false);
	const [movementsLimited, setMovementsLimited] = useState(false);
	const [collegeProvinceMap, setCollegeProvinceMap] = useState<Map<string, string>>(new Map());
	const [resolving, setResolving] = useState(false);
	const [resolvedCount, setResolvedCount] = useState(0);
	const [saving, setSaving] = useState(false);
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorData, setLimitErrorData] = useState<{ resourceType: string; plan: string; currentCount: string; limit: number } | null>(null);
	const [templateName, setTemplateName] = useState("");
	const [templateCategory, setTemplateCategory] = useState("");
	const [contentLoaded, setContentLoaded] = useState(false);
	const [rightTab, setRightTab] = useState<"fields" | "data">("fields");
	const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
	const [aiDrawerInitialMessage, setAiDrawerInitialMessage] = useState<string | undefined>();

	const [editingTitle, setEditingTitle] = useState(false);
	const [pendingFields, setPendingFields] = useState(0);

	// Representación para el asistente IA
	const [representedParty, setRepresentedParty] = useState<"actor" | "demandado" | "">("");
	const [representationType, setRepresentationType] = useState<"patrocinio" | "apoderado" | "">("");

	// Diff review panel state
	const [pendingDiff, setPendingDiff] = useState<PendingDiff | null>(null);
	const [diffLoading, setDiffLoading] = useState(false);
	const [diffLoadingLabel, setDiffLoadingLabel] = useState("");
	const [diffRefining, setDiffRefining] = useState(false);
	// IDs guardados del documento para pre-poblar selectors cuando lleguen las listas
	const [linkedFolderIdFromDoc, setLinkedFolderIdFromDoc] = useState<string | null>(null);
	const [linkedContactIdFromDoc, setLinkedContactIdFromDoc] = useState<string | null>(null);

	const printIframeRef = useRef<HTMLIFrameElement | null>(null);
	const [editorViewReady, setEditorViewReady] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextStyle,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			MergeFieldExtension,
			TabIndentExtension,
			FontSizeExtension,
			LineHeightExtension,
			Color,
			Highlight.configure({ multicolor: true }),
			PaginationPlus.configure(A4_CONFIG),
			UiState,
		],
		content: "",
		onCreate: () => setEditorViewReady(true),
	});

	// Block editor while AI is working or diff is pending
	useEffect(() => {
		if (!editor) return;
		editor.setEditable(!(diffLoading || !!pendingDiff));
	}, [editor, diffLoading, pendingDiff]);

	// Actualizar pendingFields reactivamente al cambiar el contenido del editor
	useEffect(() => {
		if (!editor) return;
		const update = () => {
			setPendingFields(countPendingFields(editor.getJSON() as Record<string, unknown>));
		};
		editor.on("update", update);
		update(); // calcular estado inicial
		return () => { editor.off("update", update); };
	}, [editor]);

	// Auto-seleccionar el primer skill si el usuario tiene exactamente uno
	useEffect(() => {
		if (userSkills.length === 1 && !selectedSkill) setSelectedSkill(userSkills[0]);
	}, [userSkills.length]);

	// Cargar carpetas, contactos y mapa de colegios al montar
	useEffect(() => {
		if (userId) {
			dispatch(getFoldersByUserId(userId) as any);
			dispatch(getContactsByUserId(userId) as any);
			dispatch(getCalculatorsByUserId(userId) as any);
		}
		axios.get("/api/colleges/?fields=name,province").then((res) => {
			if (res.data.success) {
				const map = new Map<string, string>();
				for (const c of res.data.data) map.set(c.name, c.province);
				setCollegeProvinceMap(map);
			}
		}).catch(() => {});
	}, [userId, dispatch]);

	// Modo edición: cargar documento existente (solo una vez, sin depender de allFolders/allContacts)
	useEffect(() => {
		if (!isEdit || !documentId || !editor || contentLoaded) return;
		(async () => {
			const result = await dispatch(getRichTextDocument(documentId));
			if (result.success && result.document) {
				const doc = result.document;
				setTitle(doc.title ?? "");
				setStatus(doc.status ?? "draft");
				setTemplateName(doc.templateName ?? "");
				setTemplateCategory(doc.templateCategory ?? "");
				// Guardar los IDs para pre-poblar cuando las listas estén disponibles
				if (doc.linkedFolderId) setLinkedFolderIdFromDoc(doc.linkedFolderId);
				if (doc.linkedContactId) setLinkedContactIdFromDoc(doc.linkedContactId);
				if (doc.content && Object.keys(doc.content).length > 0) {
					// Load without adding to history so Ctrl+Z doesn't wipe the document
					const parsedDoc = editor.schema.nodeFromJSON(doc.content as Parameters<typeof editor.commands.setContent>[0]);
					editor.view.dispatch(
						editor.state.tr
							.replaceWith(0, editor.state.doc.content.size, parsedDoc.content)
							.setMeta("addToHistory", false)
					);
				}
				setContentLoaded(true);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEdit, documentId, editor, contentLoaded]);

	// Pre-poblar selectedFolder cuando allFolders esté disponible
	useEffect(() => {
		if (!linkedFolderIdFromDoc || selectedFolder) return;
		const found = allFolders.find((f) => f._id === linkedFolderIdFromDoc);
		if (found) setSelectedFolder(found);
	}, [linkedFolderIdFromDoc, allFolders, selectedFolder]);

	// Pre-poblar selectedContact cuando allContacts esté disponible
	useEffect(() => {
		if (!linkedContactIdFromDoc || selectedContact) return;
		const found = allContacts.find((c) => c._id === linkedContactIdFromDoc);
		if (found) setSelectedContact(found);
	}, [linkedContactIdFromDoc, allContacts, selectedContact]);

	// Modo creación: cargar contenido de la plantilla
	useEffect(() => {
		if (isEdit || !templateId || !editor) return;
		(async () => {
			const result = await dispatch(getRichTextTemplate(templateId));
			if (result.success && result.template) {
				const tpl = result.template;
				setTemplateName(tpl.name);
				setTemplateCategory(tpl.category ?? "");
				if (!title) setTitle(tpl.name);
				if (tpl.content && Object.keys(tpl.content).length > 0) {
					const parsedTpl = editor.schema.nodeFromJSON(tpl.content as Parameters<typeof editor.commands.setContent>[0]);
					editor.view.dispatch(
						editor.state.tr
							.replaceWith(0, editor.state.doc.content.size, parsedTpl.content)
							.setMeta("addToHistory", false)
					);
				}
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isEdit, templateId, editor]);

	const handleResolve = async () => {
		if (!editor) return;
		setResolving(true);

		const payload = {
			folderId: selectedFolder?._id,
			contactId: selectedContact?._id,
			contraparteId: selectedContraparte?._id,
			calculoId: selectedCalculator?._id,
			movimientoId: selectedMovement?._id,
			movimientoData: selectedMovement?._id ? undefined : selectedMovement
				? { time: selectedMovement.time, movement: selectedMovement.movement, title: selectedMovement.title, description: selectedMovement.description }
				: undefined,
			skillId: selectedSkill?._id,
		};

		const result = await dispatch(resolveRichTextFields(payload));
		setResolving(false);

		if (!result.success || !result.resolvedFields) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al resolver campos. Intentá de nuevo.",
					variant: "alert",
					alert: { color: "error" },
				})
			);
			return;
		}

		const json = editor.getJSON() as Record<string, unknown>;
		const resolved = resolveMergeFieldsInJson(json, result.resolvedFields);
		editor.commands.setContent(resolved as Parameters<typeof editor.commands.setContent>[0]);

		// Contar cuántos se resolvieron
		const remaining = countPendingFields(resolved);
		const total = countPendingFields(json);
		const count = total - remaining;
		setResolvedCount(count);

		if (count > 0) {
			dispatch(
				openSnackbar({
					open: true,
					message: `${count} campo${count !== 1 ? "s" : ""} resuelto${count !== 1 ? "s" : ""} correctamente.`,
					variant: "alert",
					alert: { color: "success" },
				})
			);
		} else {
			dispatch(
				openSnackbar({
					open: true,
					message: "No se encontraron campos para resolver. Verificá la selección.",
					variant: "alert",
					alert: { color: "warning" },
				})
			);
		}
	};

	// ── Diff accept / reject / refine ──────────────────────────────────────

	/** Reemplaza el rango [from, to] con texto limpio (sin marks), preservando atributos de párrafo */
	const replaceWithCleanText = useCallback(
		(text: string, from: number, to: number, addToHistory: boolean) => {
			if (!editor) return;
			const schema = editor.schema;
			const fragment = text.length > 0 ? Fragment.from(schema.text(text)) : Fragment.empty;
			const tr = editor.state.tr
				.replaceWith(from, to, fragment)
				.setMeta("addToHistory", addToHistory);
			editor.view.dispatch(tr);
		},
		[editor]
	);

	const handleAcceptAll = useCallback(() => {
		if (!pendingDiff || !editor) return;
		let accepted = "";
		editor.state.doc.nodesBetween(pendingDiff.from, pendingDiff.to, (node) => {
			if (node.isText) {
				const isRemoved = node.marks.some((m) => m.type.name === "strike");
				if (!isRemoved) accepted += node.text;
			}
		});
		// Step 1: restore original without history so undo skips the diff marks state
		replaceWithCleanText(pendingDiff.originalText, pendingDiff.from, pendingDiff.to, false);
		// Step 2: apply accepted text with history — undo lands on the original text
		const restoredTo = pendingDiff.from + pendingDiff.originalText.length;
		replaceWithCleanText(accepted || " ", pendingDiff.from, restoredTo, true);
		editor.commands.focus();
		setPendingDiff(null);
	}, [editor, pendingDiff, replaceWithCleanText]);

	const handleRejectAll = useCallback(() => {
		if (!pendingDiff || !editor) return;
		// Restore original text with clean nodes — reject means "forget the suggestion entirely"
		replaceWithCleanText(pendingDiff.originalText, pendingDiff.from, pendingDiff.to, false);
		editor.commands.focus();
		setPendingDiff(null);
	}, [editor, pendingDiff, replaceWithCleanText]);

	const handleRefine = useCallback(
		async (instruction: string) => {
			if (!pendingDiff || !editor) return;
			setDiffRefining(true);

			const prompt = `Tenés este texto:\n"${pendingDiff.originalText}"\n\nAplicá la siguiente instrucción:\n${instruction}\n\nDevolvé SOLO el texto resultante, sin explicaciones ni comillas.`;

			try {
				let sseBuffer = "";
				let lastLength = 0;
				let accumulated = "";

				await ragAxios.post(
					"/rag/editor/chat",
					{ messages: [{ role: "user", content: prompt }], stream: true },
					{
						responseType: "text",
						onDownloadProgress: (progressEvent) => {
							const fullText = (progressEvent.event?.target as XMLHttpRequest)?.response ?? "";
							const newText = fullText.slice(lastLength);
							lastLength = fullText.length;
							sseBuffer += newText;
							const lines = sseBuffer.split("\n");
							sseBuffer = lines.pop() ?? "";
							for (const line of lines) {
								if (!line.startsWith("data: ")) continue;
								const raw = line.slice(6).trim();
								if (!raw) continue;
								try {
									const evt = JSON.parse(raw);
									if (evt.type === "chunk") accumulated += evt.text;
								} catch {
									// ignore malformed SSE
								}
							}
						},
					}
				);

				const result = accumulated.trim();
				if (!result) return;

				// Revert current diff to original text, preserving paragraph attributes
				editor.view.dispatch(editor.state.tr.insertText(pendingDiff.originalText, pendingDiff.from, pendingDiff.to));
				editor.commands.focus();

				// New positions after restoring original
				const newFrom = pendingDiff.from;
				const newTo = pendingDiff.from + pendingDiff.originalText.length;

				// Apply new diff without adding to undo history
				const segments = wordDiff(pendingDiff.originalText, result);
				const diffLen = segments.reduce((sum, s) => sum + s.text.length, 0);

				insertDiffWithoutHistory(editor, newFrom, newTo, segments);
				editor.commands.setTextSelection({ from: newFrom, to: newFrom + diffLen });

				setPendingDiff({
					from: newFrom,
					to: newFrom + diffLen,
					actionLabel: pendingDiff.actionLabel,
					segments,
					originalText: pendingDiff.originalText,
				});
			} catch (_err) {
				// silent fail
			} finally {
				setDiffRefining(false);
			}
		},
		[editor, pendingDiff]
	);

	// ── End diff handlers ───────────────────────────────────────────────────

	const handleOpenAiDrawer = useCallback((initialMessage?: string) => {
		setAiDrawerInitialMessage(initialMessage);
		setAiDrawerOpen(true);
	}, []);

	const handleExportPdf = useCallback(() => {
		if (!editor) return;
		const content = normalizeHtmlForPrint(editor.getHTML());

		if (printIframeRef.current) {
			document.body.removeChild(printIframeRef.current);
		}

		const iframe = document.createElement("iframe");
		iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
		document.body.appendChild(iframe);
		printIframeRef.current = iframe;

		const doc = iframe.contentWindow!.document;
		doc.open();
		doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${PRINT_CSS}</style></head><body>${content}</body></html>`);
		doc.close();

		setTimeout(() => {
			iframe.contentWindow!.focus();
			iframe.contentWindow!.print();
		}, 500);
	}, [editor]);

	const handleSave = async () => {
		if (!editor) return;

		// For new documents only, check resource limit before saving
		if (!isEdit) {
			try {
				const res = await ApiService.checkResourceLimit("postalDocuments");
				if (res.success && res.data?.hasReachedLimit) {
					setLimitErrorData({
						resourceType: "Documentos",
						plan: res.data.currentPlan || "free",
						currentCount: `${res.data.currentCount}`,
						limit: res.data.limit,
					});
					setLimitErrorOpen(true);
					return;
				}
			} catch {
				// ante error de red, permitir continuar
			}
		}

		if (!title.trim()) {
			dispatch(
				openSnackbar({
					open: true,
					message: "El título del documento es requerido.",
					variant: "alert",
					alert: { color: "warning" },
				})
			);
			return;
		}

		const pendingCount = countPendingFields(editor.getJSON() as Record<string, unknown>);
		if (pendingCount > 0) {
			dispatch(
				openSnackbar({
					open: true,
					message: `Hay ${pendingCount} campo${pendingCount !== 1 ? "s" : ""} dinámico${pendingCount !== 1 ? "s" : ""} sin resolver. Seleccioná un expediente y hacé clic en "Resolver campos".`,
					variant: "alert",
					alert: { color: "warning" },
				})
			);
			return;
		}

		setSaving(true);
		const content = editor.getJSON() as Record<string, unknown>;
		const payload = {
			title: title.trim(),
			content,
			status,
			linkedFolderId: selectedFolder?._id,
			linkedContactId: selectedContact?._id,
		};

		let result;
		if (isEdit && documentId) {
			result = await dispatch(updateRichTextDocument(documentId, payload));
		} else {
			result = await dispatch(
				createRichTextDocument({ ...payload, templateId: templateId ?? undefined })
			);
		}
		setSaving(false);

		if (result?.success) {
			dispatch(
				openSnackbar({
					open: true,
					message: isEdit ? "Documento actualizado." : "Documento guardado correctamente.",
					variant: "alert",
					alert: { color: "success" },
				})
			);
			navigate("/documentos/escritos");
		} else {
			dispatch(
				openSnackbar({
					open: true,
					message: result?.error ?? "Error al guardar el documento.",
					variant: "alert",
					alert: { color: "error" },
				})
			);
		}
	};

	// Los campos fecha.* y letrado.* se resuelven siempre desde el usuario autenticado,
	// sin necesitar ningún selector. Solo bloqueamos si no hay campos pendientes.
	const canResolve = pendingFields > 0;

	const folderCalculators = useMemo(() => {
		if (!selectedFolder) return [];
		return allCalculators.filter((c) => c.folderId === selectedFolder._id && c.type === "Calculado");
	}, [allCalculators, selectedFolder]);

	const MOVEMENTS_PAGE_SIZE = 20;
	const LOAD_MORE_ID = '__load_more__';

	// Carga de movimientos con paginación
	const loadMovements = async (folderId: string, page: number, append: boolean) => {
		setMovementsLoading(true);
		const res: any = await dispatch(getMovementsByFolderId(folderId, { page, limit: MOVEMENTS_PAGE_SIZE }) as any);
		setMovementsLoading(false);
		if (res?.success) {
			const newMovements: Movement[] = res.movements ?? [];
			const total: number = res.pagination?.total ?? newMovements.length;
			const availableMovements: number = res.pjnAccess?.availableMovements ?? 0;
			setFolderMovements((prev) => append ? [...prev, ...newMovements] : newMovements);
			setMovementsTotal(total);
			setMovementsPage(page);
			setMovementsLimited(availableMovements > 0);
		}
	};

	// Limpiar el cálculo y movimiento seleccionados cuando cambia el expediente; cargar movimientos del folder
	useEffect(() => {
		setSelectedCalculator(null);
		setSelectedMovement(null);
		setFolderMovements([]);
		setMovementsPage(1);
		setMovementsTotal(0);
		setMovementsLimited(false);
		if (selectedFolder?._id) loadMovements(selectedFolder._id, 1, false);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFolder?._id, allContacts, collegeProvinceMap]);

	// Auto-seleccionar actor y demandado al cambiar el expediente o cuando cargan los contactos
	useEffect(() => {
		if (!selectedFolder) {
			setSelectedContact(null);
			setSelectedContraparte(null);
			return;
		}
		const hasRole = (role: any, target: string) => {
			if (Array.isArray(role)) return role.some((r: string) => r?.toLowerCase() === target);
			return typeof role === "string" && role.toLowerCase() === target;
		};
		const linked = allContacts.filter((c) => c.folderIds?.includes(selectedFolder._id));
		const actor = linked.find((c) => hasRole(c.role, "actor"));
		const demandado = linked.find((c) => hasRole(c.role, "demandado"));
		if (actor) setSelectedContact(actor);
		if (demandado) setSelectedContraparte(demandado);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFolder?._id, allContacts]);

	// Auto-seleccionar matrícula al cambiar el expediente o cuando carga el mapa de colegios
	useEffect(() => {
		if (!selectedFolder || userSkills.length <= 1 || collegeProvinceMap.size === 0) return;

		const jurisLabel = typeof selectedFolder.folderJuris === "string"
			? selectedFolder.folderJuris
			: (selectedFolder.folderJuris as any)?.label ?? "";
		const jurisItem: string = (selectedFolder.folderJuris as any)?.item ?? "";

		// CPACF para: PJN explícito, label Nacional, label CABA (todos los fueros CABA),
		// Ciudad Autónoma de Buenos Aires, o item que contenga "Justicia Nacional"
		const isCpacf =
			selectedFolder.pjn === true ||
			jurisLabel.toLowerCase() === "nacional" ||
			jurisLabel === "CABA" ||
			jurisLabel === "Ciudad Autónoma de Buenos Aires" ||
			jurisItem.includes("Justicia Nacional");

		const targetProvince = isCpacf
			? null
			: selectedFolder.mev === true || jurisLabel === "Buenos Aires"
				? "Buenos Aires"
				: jurisLabel;

		if (isCpacf) {
			const match = userSkills.find((s: any) => s.name === "Colegio Público de Abogados de la Capital Federal");
			if (match) setSelectedSkill(match);
		} else if (targetProvince) {
			const match = userSkills.find((s: any) => collegeProvinceMap.get(s.name) === targetProvince);
			if (match) setSelectedSkill(match);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFolder?._id, collegeProvinceMap]);

	const caseContext = useMemo((): CaseContext => ({
		representedParty: (representedParty as CaseContext["representedParty"]) || null,
		representationType: (representationType as CaseContext["representationType"]) || null,
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

	const sortedContacts = useMemo(() => {
		if (!selectedFolder) return allContacts;
		const linked: typeof allContacts = [];
		const others: typeof allContacts = [];
		for (const c of allContacts) {
			if (c.folderIds?.includes(selectedFolder._id)) linked.push(c);
			else others.push(c);
		}
		return [...linked, ...others];
	}, [allContacts, selectedFolder]);

	return (
		<Stack className="tiptap-root" spacing={1} sx={{ height: "calc(100vh - 80px)" }}>
			{/* Header */}
			<MainCard sx={{ "& .MuiCardContent-root": { py: "10px !important" } }}>
				<Stack direction="row" alignItems="flex-start" gap={1.5}>
					{/* Botón volver — fuera de la columna para no romper alineación entre filas */}
					<Tooltip title="Volver">
						<IconButton onClick={() => navigate("/documentos/escritos")} sx={{ mt: 0.25, flexShrink: 0, p: 1, borderRadius: 1.5, "&:hover": { bgcolor: "action.hover", transform: "translateX(-1px)" }, transition: "transform 0.15s" }}>
							<ArrowLeft2 size={18} />
						</IconButton>
					</Tooltip>

					{/* Columna de contenido: ambas filas con el mismo punto de inicio */}
					<Stack spacing={1} flex={1} minWidth={0}>

						{/* Fila 1: identidad del documento + acciones principales */}
						<Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
							{/* Título inline editable + modelo */}
							<Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
								{editingTitle ? (
									<TextField
										size="small"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										onBlur={() => setEditingTitle(false)}
										onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
										autoFocus
										inputProps={{ maxLength: 160 }}
										sx={{ minWidth: 220 }}
									/>
								) : (
									<Typography variant="body2" fontWeight={600} noWrap onClick={() => setEditingTitle(true)}
										sx={{
											cursor: "text",
											minWidth: 0,
											maxWidth: 320,
											color: title ? "text.primary" : "text.disabled",
											borderBottom: "1px dashed transparent",
											transition: "border-color 0.15s",
											"&:hover": { borderBottomColor: "text.disabled" },
										}}
									>
										{title || "Sin título"}
									</Typography>
								)}
								{templateName && (
									<>
										<Typography variant="body2" color="text.disabled" sx={{ flexShrink: 0, userSelect: "none", mx: 0.5, opacity: 0.35 }}>—</Typography>
										<Typography variant="caption" color="text.secondary" noWrap sx={{ flexShrink: 0, maxWidth: 220 }}>
											Modelo: {templateName}
										</Typography>
									</>
								)}
							</Stack>

							<Box sx={{ flexShrink: 0 }} />

							<FormControl size="small" sx={{ minWidth: 120 }}>
								<InputLabel>Estado</InputLabel>
								<Select
									label="Estado"
									value={status}
									onChange={(e) => setStatus(e.target.value as RichTextDocumentStatus)}
								>
									<MenuItem value="draft">Borrador</MenuItem>
									<MenuItem value="final">Final</MenuItem>
								</Select>
							</FormControl>

							<Tooltip title={saving ? "" : isEdit ? "Actualizar documento" : "Guardar documento"} placement="bottom">
								<span>
									<Button
										variant="contained"
										size="small"
										onClick={handleSave}
										disabled={saving}
										startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save2 size={15} />}
									>
										{saving ? "Guardando..." : "Guardar"}
									</Button>
								</span>
							</Tooltip>
							<Tooltip title="Asistente IA">
								<IconButton
									size="small"
									onClick={() => handleOpenAiDrawer()}
									color={aiDrawerOpen ? "secondary" : "default"}
									sx={{ borderRadius: 1.5 }}
								>
									<AiSparklesIcon size={18} />
								</IconButton>
							</Tooltip>
						</Stack>

					</Stack>
				</Stack>
			</MainCard>

			{/* Editor area */}
			<Box
				sx={{
					flex: 1,
					minHeight: 0,
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 1,
					overflow: "hidden",
					display: "flex",
					flexDirection: "column",
					bgcolor: "background.paper",
					position: "relative",
				}}
			>
				{editor && <EditorToolbar editor={editor} onExportPdf={handleExportPdf} />}

				{/* Overlay: block all editor interaction while diff is pending or loading */}
				{(diffLoading || !!pendingDiff) && (
					<Box
						sx={{
							position: "absolute",
							inset: 0,
							zIndex: 10,
							pointerEvents: "all",
						}}
					/>
				)}

				<Box sx={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
					<Box className={`tiptap-scroll${pendingFields > 0 ? " has-pending" : ""}`} sx={{ flex: 1, position: "relative" }}>
						{editor && editorViewReady && <DragContextMenu editor={editor} />}
						{editor && editorViewReady && (
							<SelectionBubble
								editor={editor}
								onLoadingStart={(label) => { setDiffLoadingLabel(label); setDiffLoading(true); }}
								onDiffReady={(diff) => { setPendingDiff(diff); setDiffLoading(false); }}
								hasPendingDiff={!!pendingDiff}
								caseContext={caseContext}
							/>
						)}
						<EditorContent editor={editor} className="tiptap-editor-content" />
						{editor && editorViewReady && <SlashDropdownMenu editor={editor} config={SLASH_MENU_CONFIG} />}

					</Box>

					{editor && (
						<Box
							sx={{
								width: 300,
								flexShrink: 0,
								borderLeft: "2px solid",
								borderColor: "primary.light",
								display: "flex",
								flexDirection: "column",
								bgcolor: "background.default",
								overflow: "hidden",
							}}
						>
							<Tabs
								value={rightTab}
								onChange={(_e, v) => setRightTab(v)}
								variant="fullWidth"
								sx={{
									minHeight: 52,
									flexShrink: 0,
									borderBottom: "1px solid",
									borderColor: "divider",
									"& .MuiTab-root": { minHeight: 52, fontSize: "0.7rem", textTransform: "none", py: 0.5, opacity: 0.5, transition: "all 0.15s" },
									"& .MuiTab-root.Mui-selected": { opacity: 1, fontWeight: 700 },
								}}
								TabIndicatorProps={{ style: { height: 3 } }}
					>
						<Tab value="fields"
							icon={<DocumentText size={18} />}
							iconPosition="top"
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Variables</span>
									<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: pendingFields > 0 ? "warning.main" : "grey.400", display: "inline-block", flexShrink: 0 }} />
								</Stack>
							}
						/>
						<Tab value="data"
							icon={<Setting4 size={18} />}
							iconPosition="top"
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Datos</span>
									<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: pendingFields > 0 ? "warning.main" : "grey.400", display: "inline-block", flexShrink: 0 }} />
								</Stack>
							}
						/>
					</Tabs>
						{/* Siempre montados para preservar estado; visibilidad por display */}
						<Box sx={{ display: rightTab === "fields" ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}>
							<MergeFieldsPanel editor={editor} embedded />
						</Box>
						<Box sx={{ display: rightTab === "data" ? "flex" : "none", flex: 1, flexDirection: "column", overflow: "hidden" }}>
							<Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
								<Stack spacing={1.5}>
									<Autocomplete
										options={allFolders}
										getOptionLabel={(f) => f.folderName ?? ""}
										value={selectedFolder}
										onChange={(_e, val) => setSelectedFolder(val)}
										size="small"
										fullWidth
										renderInput={(params) => <TextField {...params} label="Expediente" placeholder="Buscar..." />}
										renderOption={(props, option) => (
											<li {...props} key={option._id}>
												<Stack>
													<Typography variant="body2">{option.folderName}</Typography>
													{option.judFolder?.numberJudFolder && <Typography variant="caption" color="text.secondary">{option.judFolder.numberJudFolder}</Typography>}
												</Stack>
											</li>
										)}
									/>
									<Autocomplete
										options={sortedContacts}
										groupBy={selectedFolder ? (c) => (c.folderIds?.includes(selectedFolder._id) ? "Vinculados al expediente" : "Otros contactos") : undefined}
										getOptionLabel={getContactDisplayName}
										value={selectedContact}
										onChange={(_e, val) => setSelectedContact(val)}
										size="small"
										fullWidth
										renderInput={(params) => <TextField {...params} label="Actor" placeholder="Buscar..." />}
										renderOption={(props, option) => (
											<li {...props} key={option._id}>
												<Stack spacing={0}>
													<Typography variant="body2">{getContactDisplayName(option)}</Typography>
												</Stack>
											</li>
										)}
									/>
									<Autocomplete
										options={sortedContacts}
										groupBy={selectedFolder ? (c) => (c.folderIds?.includes(selectedFolder._id) ? "Vinculados al expediente" : "Otros contactos") : undefined}
										getOptionLabel={getContactDisplayName}
										value={selectedContraparte}
										onChange={(_e, val) => setSelectedContraparte(val)}
										size="small"
										fullWidth
										renderInput={(params) => <TextField {...params} label="Demandado" placeholder="Buscar..." />}
										renderOption={(props, option) => (
											<li {...props} key={option._id}>
												<Stack spacing={0}>
													<Typography variant="body2">{getContactDisplayName(option)}</Typography>
												</Stack>
											</li>
										)}
									/>
									<Autocomplete
										options={folderCalculators}
										getOptionLabel={(c) => c.description || `${c.classType ?? ""} ${c.subClassType ?? ""}`.trim() || "Cálculo"}
										value={selectedCalculator}
										onChange={(_e, val) => setSelectedCalculator(val)}
										size="small"
										fullWidth
										noOptionsText={selectedFolder ? "Sin cálculos para este expediente" : "Seleccioná un expediente primero"}
										disabled={!selectedFolder}
										renderInput={(params) => <TextField {...params} label="Cálculo" placeholder="Buscar..." />}
										renderOption={(props, option) => (
											<li {...props} key={option._id}>
												<Stack spacing={0}>
													<Typography variant="body2">{option.description || "Sin descripción"}</Typography>
													<Typography variant="caption" color="text.secondary">
															{[option.classType, option.subClassType].filter(Boolean).join(" — ")} · {option.amount != null ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(option.amount) : ""}
													</Typography>
												</Stack>
											</li>
										)}
									/>
									<Autocomplete
										options={[...folderMovements, ...(folderMovements.length < movementsTotal ? [{ _id: LOAD_MORE_ID, title: movementsLoading ? "Cargando..." : `Cargar más (${folderMovements.length} de ${movementsTotal})`, movement: "", folderId: "", userId: "", time: "" } as Movement] : [])]}
										getOptionLabel={(m) => m._id === LOAD_MORE_ID ? "" : (m.title || m.movement || "Movimiento")}
										value={selectedMovement}
										onChange={(_e, val) => {
											if (val?._id === LOAD_MORE_ID) {
												if (!movementsLoading && selectedFolder?._id) loadMovements(selectedFolder._id, movementsPage + 1, true);
												return;
											}
											setSelectedMovement(val);
										}}
										size="small"
										fullWidth
										noOptionsText={selectedFolder ? "Sin movimientos para este expediente" : "Seleccioná un expediente primero"}
										disabled={!selectedFolder}
										renderInput={(params) => (
											<TextField
												{...params}
												label="Movimiento"
												placeholder="Buscar..."
												InputProps={{
													...params.InputProps,
													...(movementsLimited ? { endAdornment: (<><Tooltip title="Plan gratuito: se muestran solo los últimos movimientos." placement="top" arrow><Warning2 size={14} style={{ color: "var(--mui-palette-warning-main, #ed6c02)", cursor: "help", flexShrink: 0 }} /></Tooltip>{params.InputProps.endAdornment}</>) } : {}),
												}}
											/>
										)}
										renderOption={(props, option) => {
											if (option._id === LOAD_MORE_ID) return (<li {...props} key="load-more" style={{ justifyContent: "center" }}><Typography variant="caption" color="primary.main" sx={{ fontStyle: "italic", py: 0.5 }}>{movementsLoading ? "Cargando..." : `Cargar más (${folderMovements.length} de ${movementsTotal})`}</Typography></li>);
											return (<li {...props} key={option._id}><Stack spacing={0}><Typography variant="body2" noWrap>{option.title}</Typography><Typography variant="caption" color="text.secondary">{option.movement}{option.time ? ` · ${new Date(option.time).toLocaleDateString("es-AR")}` : ""}</Typography></Stack></li>);
										}}
									/>
									<Autocomplete
											options={userSkills}
											getOptionLabel={(s) => s.name || ""}
											value={selectedSkill}
											onChange={(_e, val) => setSelectedSkill(val)}
											size="small"
											fullWidth
											noOptionsText={
												<Typography variant="caption" color="text.secondary">
													Sin matrículas. Cargalas en{" "}
													<Link to="/apps/profiles/user/professional" style={{ fontWeight: 600, color: "inherit" }}>
														Perfil → Usuario → Información Profesional
													</Link>
												</Typography>
											}
											renderInput={(params) => (
												<TextField
													{...params}
													label="Matrícula"
													placeholder="Seleccionar..."
													InputProps={{
														...params.InputProps,
														...(userSkills.length === 0 ? { endAdornment: (<><Tooltip title="No hay matrículas cargadas. Hacé clic en el selector para ver cómo agregarlas." placement="top" arrow><Warning2 size={14} style={{ color: "var(--mui-palette-warning-main, #ed6c02)", cursor: "help", flexShrink: 0 }} /></Tooltip>{params.InputProps.endAdornment}</>) } : {}),
													}}
												/>
											)}
											renderOption={(props, option) => (
												<li {...props} key={option._id || option.name}>
													<Stack spacing={0}>
														<Typography variant="body2" noWrap>{option.name}</Typography>
														{option.registrationNumber && <Typography variant="caption" color="text.secondary">Mat. {option.registrationNumber}</Typography>}
													</Stack>
												</li>
											)}
										/>
										<Divider />
										{/* Contexto de representación para el asistente IA */}
										<Stack spacing={1}>
											<Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem" }}>
												Asistente IA
											</Typography>
											<FormControl size="small" fullWidth>
												<InputLabel sx={{ fontSize: "0.78rem" }}>Parte representada</InputLabel>
												<Select
													label="Parte representada"
													value={representedParty}
													onChange={(e) => setRepresentedParty(e.target.value as typeof representedParty)}
													sx={{ fontSize: "0.78rem" }}
												>
													<MenuItem value=""><em>Sin especificar</em></MenuItem>
													<MenuItem value="actor">Actor / Demandante</MenuItem>
													<MenuItem value="demandado">Demandado</MenuItem>
												</Select>
											</FormControl>
											<FormControl size="small" fullWidth>
												<InputLabel sx={{ fontSize: "0.78rem" }}>Tipo de representación</InputLabel>
												<Select
													label="Tipo de representación"
													value={representationType}
													onChange={(e) => setRepresentationType(e.target.value as typeof representationType)}
													sx={{ fontSize: "0.78rem" }}
												>
													<MenuItem value=""><em>Sin especificar</em></MenuItem>
													<MenuItem value="patrocinio">Patrocinio (1ª persona)</MenuItem>
													<MenuItem value="apoderado">Apoderado (3ª persona)</MenuItem>
												</Select>
											</FormControl>
										</Stack>
										<Divider />
									<Tooltip title={pendingFields === 0 ? "No hay campos dinámicos en el documento" : `Resolver ${pendingFields} campo${pendingFields !== 1 ? "s" : ""}`}>
										<span>
											<Button variant="contained" size="small" color="secondary" fullWidth onClick={handleResolve} disabled={!canResolve || resolving}
												startIcon={resolving ? <CircularProgress size={14} color="inherit" /> : resolvedCount > 0 ? <Refresh size={14} /> : <MagicStar size={14} />}
											>
												{resolving ? "Resolviendo..." : resolvedCount > 0 ? "Resolver de nuevo" : "Resolver campos"}
											</Button>
										</span>
									</Tooltip>
									{pendingFields > 0 && <Chip label={`${pendingFields} campo${pendingFields !== 1 ? "s" : ""} sin resolver`} size="small" color="warning" variant="outlined" />}
									{resolvedCount > 0 && pendingFields === 0 && <Chip label={`${resolvedCount} campo${resolvedCount !== 1 ? "s" : ""} resuelto${resolvedCount !== 1 ? "s" : ""}`} size="small" color="success" variant="outlined" />}
								</Stack>
							</Box>
						</Box>
						</Box>
					)}
				</Box>

			</Box>

		{editor && (
			<DiffReviewPanel
				editor={editor}
				diff={pendingDiff}
				loading={diffLoading}
				loadingLabel={diffLoadingLabel}
				onAcceptAll={handleAcceptAll}
				onRejectAll={handleRejectAll}
				onRefine={handleRefine}
				onClose={handleRejectAll}
				refining={diffRefining}
			/>
		)}

		<Drawer
			anchor="right"
			open={aiDrawerOpen}
			onClose={() => setAiDrawerOpen(false)}
			PaperProps={{ sx: { width: 440, display: "flex", flexDirection: "column" } }}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between" px={2} py={1.25} sx={{ borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<AiSparklesIcon size={16} />
					<Typography variant="subtitle2" fontWeight={600}>Asistente IA</Typography>
				</Stack>
				<IconButton size="small" onClick={() => setAiDrawerOpen(false)}>
					<CloseCircle size={18} />
				</IconButton>
			</Stack>
			<Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
				{editor && <AiChatPanel editor={editor} embedded movements={folderMovements} movementsLimited={movementsLimited} caseContext={caseContext} initialMessage={aiDrawerInitialMessage} />}
			</Box>
		</Drawer>

		<LimitErrorModal
			open={limitErrorOpen}
			onClose={() => setLimitErrorOpen(false)}
			message="Has alcanzado el límite de documentos para tu plan actual."
			limitInfo={limitErrorData ?? undefined}
		/>
		</Stack>
	);
};

export default DocumentEditorPage;
