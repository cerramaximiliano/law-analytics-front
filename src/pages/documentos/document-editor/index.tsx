import "../../../pages/herramientas/editor-poc/editor.css";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { ArrowLeft2, Cpu, DocumentText, MagicStar, Refresh } from "iconsax-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
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
import MainCard from "components/MainCard";
import EditorToolbar from "pages/herramientas/editor-poc/EditorToolbar";
import MergeFieldsPanel from "pages/herramientas/editor-poc/MergeFieldsPanel";
import AiChatPanel from "pages/herramientas/editor-poc/AiChatPanel";
import MergeFieldExtension from "pages/herramientas/editor-poc/extensions/MergeFieldExtension";
import TabIndentExtension from "pages/herramientas/editor-poc/extensions/TabIndentExtension";
import FontSizeExtension from "pages/herramientas/editor-poc/extensions/FontSizeExtension";
import LineHeightExtension from "pages/herramientas/editor-poc/extensions/LineHeightExtension";
import { Color } from "@tiptap/extension-color";
import { FolderData } from "types/folder";
import { Contact } from "types/contact";
import { RichTextDocumentStatus } from "types/rich-text-document";

// ==============================|| DOCUMENT EDITOR ||============================== //

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
): Record<string, unknown> {
	if (node.type === "mergeField") {
		const key = (node.attrs as Record<string, string>)?.key ?? "";
		if (resolved[key] !== undefined) {
			return { type: "text", text: resolved[key] };
		}
		return node; // mantiene el nodo mergeField para que countPendingFields lo detecte
	}
	if (Array.isArray(node.content)) {
		return {
			...node,
			content: (node.content as Record<string, unknown>[]).map((child) =>
				resolveMergeFieldsInJson(child, resolved)
			),
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
	const [resolving, setResolving] = useState(false);
	const [resolvedCount, setResolvedCount] = useState(0);
	const [saving, setSaving] = useState(false);
	const [templateName, setTemplateName] = useState("");
	const [templateCategory, setTemplateCategory] = useState("");
	const [contentLoaded, setContentLoaded] = useState(false);
	const [aiPanelOpen, setAiPanelOpen] = useState(false);
	const [pendingFields, setPendingFields] = useState(0);
	// IDs guardados del documento para pre-poblar selectors cuando lleguen las listas
	const [linkedFolderIdFromDoc, setLinkedFolderIdFromDoc] = useState<string | null>(null);
	const [linkedContactIdFromDoc, setLinkedContactIdFromDoc] = useState<string | null>(null);

	const printIframeRef = useRef<HTMLIFrameElement | null>(null);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextStyle,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Placeholder.configure({ placeholder: "Comenzá a escribir o cargá una plantilla..." }),
			MergeFieldExtension,
			TabIndentExtension,
			FontSizeExtension,
			LineHeightExtension,
			Color,
			PaginationPlus.configure(A4_CONFIG),
		],
		content: "",
	});

	// Actualizar pendingFields reactivamente al cambiar el contenido del editor
	useEffect(() => {
		if (!editor) return;
		const update = () => setPendingFields(countPendingFields(editor.getJSON() as Record<string, unknown>));
		editor.on("update", update);
		update(); // calcular estado inicial
		return () => { editor.off("update", update); };
	}, [editor]);

	// Auto-seleccionar el primer skill si el usuario tiene exactamente uno
	useEffect(() => {
		if (userSkills.length === 1 && !selectedSkill) setSelectedSkill(userSkills[0]);
	}, [userSkills.length]);

	// Cargar carpetas y contactos al montar
	useEffect(() => {
		if (userId) {
			dispatch(getFoldersByUserId(userId) as any);
			dispatch(getContactsByUserId(userId) as any);
			dispatch(getCalculatorsByUserId(userId) as any);
		}
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
					editor.commands.setContent(doc.content as Parameters<typeof editor.commands.setContent>[0]);
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
					editor.commands.setContent(tpl.content as Parameters<typeof editor.commands.setContent>[0]);
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
			setFolderMovements((prev) => append ? [...prev, ...newMovements] : newMovements);
			setMovementsTotal(total);
			setMovementsPage(page);
		}
	};

	// Limpiar el cálculo y movimiento seleccionados cuando cambia el expediente; cargar movimientos del folder
	useEffect(() => {
		setSelectedCalculator(null);
		setSelectedMovement(null);
		setFolderMovements([]);
		setMovementsPage(1);
		setMovementsTotal(0);
		if (selectedFolder?._id) loadMovements(selectedFolder._id, 1, false);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFolder?._id]);

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
		<Stack spacing={2} sx={{ height: "calc(100vh - 80px)" }}>
			{/* Header */}
			<MainCard>
				<Stack direction="row" alignItems="flex-start" gap={1.5}>
					{/* Botón volver — fuera de la columna para no romper alineación entre filas */}
					<Tooltip title="Volver">
						<IconButton size="small" onClick={() => navigate("/documentos/escritos")} sx={{ mt: 0.25, flexShrink: 0 }}>
							<ArrowLeft2 size={18} />
						</IconButton>
					</Tooltip>

					{/* Columna de contenido: ambas filas con el mismo punto de inicio */}
					<Stack spacing={1.5} flex={1} minWidth={0}>

						{/* Fila 1: identidad del documento + acciones principales */}
						<Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
							<Stack spacing={1.5} sx={{ minWidth: 220, flex: 1, maxWidth: 280 }}>
								{templateName && (
									<Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "text.secondary" }}>
										<DocumentText size={13} />
										<Typography variant="body2" fontWeight={500} noWrap>
											{templateName}
										</Typography>
									</Stack>
								)}
								<TextField
									size="small"
									label="Título del documento"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									fullWidth
									inputProps={{ maxLength: 160 }}
								/>
							</Stack>

							<Box sx={{ flex: 1 }} />

							<Button
								size="small"
								variant={aiPanelOpen ? "contained" : "text"}
								color="secondary"
								onClick={() => setAiPanelOpen((v) => !v)}
								startIcon={<Cpu size={16} />}
								sx={{ whiteSpace: "nowrap" }}
							>
								Asistente IA
							</Button>

							<Divider orientation="vertical" flexItem />

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

							<Button
								variant="contained"
								size="small"
								onClick={handleSave}
								disabled={saving || pendingFields > 0}
								startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
							>
								{saving ? "Guardando..." : isEdit ? "Actualizar documento" : "Guardar documento"}
							</Button>
						</Stack>

						<Divider />

						{/* Fila 2: resolución de campos dinámicos */}
						<Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5}>
							<Autocomplete
								options={allFolders}
								getOptionLabel={(f) => f.folderName ?? ""}
								value={selectedFolder}
								onChange={(_e, val) => setSelectedFolder(val)}
								size="small"
								sx={{ minWidth: 220, flex: 1, maxWidth: 280 }}
								renderInput={(params) => <TextField {...params} label="Expediente" placeholder="Buscar..." />}
								renderOption={(props, option) => (
									<li {...props} key={option._id}>
										<Stack>
											<Typography variant="body2">{option.folderName}</Typography>
											{option.judFolder?.numberJudFolder && (
												<Typography variant="caption" color="text.secondary">
													{option.judFolder.numberJudFolder}
												</Typography>
											)}
										</Stack>
									</li>
								)}
							/>

							<Autocomplete
								options={sortedContacts}
								groupBy={selectedFolder ? (c) => (c.folderIds?.includes(selectedFolder._id) ? "Vinculados al expediente" : "Otros contactos") : undefined}
								getOptionLabel={(c) => [c.name, c.lastName !== "-" ? c.lastName : ""].filter(Boolean).join(" ")}
								value={selectedContact}
								onChange={(_e, val) => setSelectedContact(val)}
								size="small"
								sx={{ minWidth: 200, flex: 1, maxWidth: 260 }}
								renderInput={(params) => <TextField {...params} label="Cliente" placeholder="Buscar..." />}
								renderOption={(props, option) => (
									<li {...props} key={option._id}>
										<Stack spacing={0}>
											<Typography variant="body2">
												{[option.name, option.lastName !== "-" ? option.lastName : ""].filter(Boolean).join(" ")}
											</Typography>
											{option.intervinienteRef?.tipoParte && (
												<Typography variant="caption" color="text.secondary">
													{option.intervinienteRef.tipoParte}
												</Typography>
											)}
										</Stack>
									</li>
								)}
							/>

							<Autocomplete
								options={sortedContacts}
								groupBy={selectedFolder ? (c) => (c.folderIds?.includes(selectedFolder._id) ? "Vinculados al expediente" : "Otros contactos") : undefined}
								getOptionLabel={(c) => [c.name, c.lastName !== "-" ? c.lastName : "", c.company].filter(Boolean).join(" ")}
								value={selectedContraparte}
								onChange={(_e, val) => setSelectedContraparte(val)}
								size="small"
								sx={{ minWidth: 200, flex: 1, maxWidth: 260 }}
								renderInput={(params) => <TextField {...params} label="Contraparte" placeholder="Buscar..." />}
								renderOption={(props, option) => (
									<li {...props} key={option._id}>
										<Stack spacing={0}>
											<Typography variant="body2">
												{[option.name, option.lastName !== "-" ? option.lastName : "", option.company].filter(Boolean).join(" ")}
											</Typography>
											{option.intervinienteRef?.tipoParte && (
												<Typography variant="caption" color="text.secondary">
													{option.intervinienteRef.tipoParte}
												</Typography>
											)}
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
								noOptionsText={selectedFolder ? "Sin cálculos para este expediente" : "Seleccioná un expediente primero"}
								disabled={!selectedFolder}
								sx={{ minWidth: 200, flex: 1, maxWidth: 240 }}
								renderInput={(params) => <TextField {...params} label="Cálculo" placeholder="Buscar..." />}
								renderOption={(props, option) => (
									<li {...props} key={option._id}>
										<Stack spacing={0}>
											<Typography variant="body2">
												{option.description || "Sin descripción"}
											</Typography>
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
								noOptionsText={selectedFolder ? "Sin movimientos para este expediente" : "Seleccioná un expediente primero"}
								disabled={!selectedFolder}
								sx={{ minWidth: 200, flex: 1, maxWidth: 260 }}
								renderInput={(params) => <TextField {...params} label="Movimiento" placeholder="Buscar..." />}
								renderOption={(props, option) => {
									if (option._id === LOAD_MORE_ID) {
										return (
											<li {...props} key="load-more" style={{ justifyContent: "center" }}>
												<Typography variant="caption" color="primary.main" sx={{ fontStyle: "italic", py: 0.5 }}>
													{movementsLoading ? "Cargando..." : `Cargar más (${folderMovements.length} de ${movementsTotal})`}
												</Typography>
											</li>
										);
									}
									return (
										<li {...props} key={option._id}>
											<Stack spacing={0}>
												<Typography variant="body2" noWrap>{option.title}</Typography>
												<Typography variant="caption" color="text.secondary">
													{option.movement}{option.time ? ` Â· ${new Date(option.time).toLocaleDateString("es-AR")}` : ""}
												</Typography>
											</Stack>
										</li>
									);
								}}
							/>

							{userSkills.length > 1 && (
								<Autocomplete
									options={userSkills}
									getOptionLabel={(s) => s.name || ""}
									value={selectedSkill}
									onChange={(_e, val) => setSelectedSkill(val)}
									size="small"
									placeholder="Colegio"
									sx={{ minWidth: 180, flex: 1, maxWidth: 240 }}
									renderInput={(params) => <TextField {...params} label="Colegio" placeholder="Seleccionar..." />}
									renderOption={(props, option) => (
										<li {...props} key={option._id || option.name}>
											<Stack spacing={0}>
												<Typography variant="body2" noWrap>{option.name}</Typography>
												{option.registrationNumber && (
													<Typography variant="caption" color="text.secondary">Mat. {option.registrationNumber}</Typography>
												)}
											</Stack>
										</li>
									)}
								/>
							)}

							<Tooltip
								title={
									pendingFields === 0
										? "No hay campos dinámicos en el documento"
										: `Resolver ${pendingFields} campo${pendingFields !== 1 ? "s" : ""}`
								}
							>
								<span>
									<Button
										variant="contained"
										size="small"
										color="secondary"
										onClick={handleResolve}
										disabled={!canResolve || resolving}
										startIcon={
											resolving ? (
												<CircularProgress size={14} color="inherit" />
											) : resolvedCount > 0 ? (
												<Refresh size={14} />
											) : (
												<MagicStar size={14} />
											)
										}
									>
										{resolving ? "Resolviendo..." : resolvedCount > 0 ? "Resolver de nuevo" : "Resolver campos"}
									</Button>
								</span>
							</Tooltip>

							{pendingFields > 0 && (
								<Tooltip title="Resolvé los campos dinámicos antes de guardar">
									<Chip
										label={`${pendingFields} campo${pendingFields !== 1 ? "s" : ""} sin resolver`}
										size="small"
										color="warning"
										variant="outlined"
									/>
								</Tooltip>
							)}

							{resolvedCount > 0 && pendingFields === 0 && (
								<Chip
									label={`${resolvedCount} campo${resolvedCount !== 1 ? "s" : ""} resuelto${resolvedCount !== 1 ? "s" : ""}`}
									size="small"
									color="success"
									variant="outlined"
								/>
							)}
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
				}}
			>
				{editor && <EditorToolbar editor={editor} onExportPdf={handleExportPdf} />}

				<Box sx={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
					<Box className="tiptap-scroll" sx={{ flex: 1 }}>
						<EditorContent editor={editor} className="tiptap-editor-content" />
					</Box>

					{editor && <MergeFieldsPanel editor={editor} />}
					{editor && aiPanelOpen && <AiChatPanel editor={editor} onClose={() => setAiPanelOpen(false)} pdfUrl={selectedMovement?.link ?? undefined} />}
				</Box>
			</Box>
		</Stack>
	);
};

export default DocumentEditorPage;
