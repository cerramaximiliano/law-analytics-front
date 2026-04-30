import "../../../pages/herramientas/editor-poc/editor.css";
import "../../../styles/_variables.scss";
import "../../../styles/_keyframe-animations.scss";
import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Box,
	Stack,
	TextField,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Button,
	CircularProgress,
	Alert,
	Tooltip,
	IconButton,
	Typography,
	Chip,
} from "@mui/material";
import { ArrowLeft2 } from "iconsax-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import { PaginationPlus } from "tiptap-pagination-plus";
import { useDispatch, useSelector } from "store";
import { getRichTextTemplate, createRichTextTemplate, updateRichTextTemplate } from "store/reducers/richTextDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import MainCard from "components/MainCard";
import EditorToolbar from "pages/herramientas/editor-poc/EditorToolbar";
import MergeFieldsPanel from "pages/herramientas/editor-poc/MergeFieldsPanel";
import MergeFieldExtension from "pages/herramientas/editor-poc/extensions/MergeFieldExtension";
import TabIndentExtension from "pages/herramientas/editor-poc/extensions/TabIndentExtension";
import FontSizeExtension from "pages/herramientas/editor-poc/extensions/FontSizeExtension";
import LineHeightExtension from "pages/herramientas/editor-poc/extensions/LineHeightExtension";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { type RichTextTemplateCategory } from "types/rich-text-document";

// ==============================|| TEMPLATE EDITOR ||============================== //

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

const CATEGORIES: { value: RichTextTemplateCategory; label: string }[] = [
	{ value: "civil", label: "Civil" },
	{ value: "laboral", label: "Laboral" },
	{ value: "penal", label: "Penal" },
	{ value: "familia", label: "Familia" },
	{ value: "societario", label: "Societario" },
	{ value: "otro", label: "Otro" },
];

const normalizeHtmlForPrint = (html: string) =>
	html.replace(/<p><\/p>/g, "<p><br></p>").replace(/\t/g, '<span style="display:inline-block;width:2cm"></span>');

/** Recursively collect all mergeField node keys from TipTap JSON */
function extractMergeFields(node: Record<string, unknown>): string[] {
	const keys: string[] = [];
	if (node.type === "mergeField" && node.attrs) {
		const attrs = node.attrs as Record<string, unknown>;
		if (typeof attrs.key === "string") keys.push(attrs.key);
	}
	if (Array.isArray(node.content)) {
		for (const child of node.content as Record<string, unknown>[]) {
			keys.push(...extractMergeFields(child));
		}
	}
	return [...new Set(keys)];
}

const TemplateEditorPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const isEdit = Boolean(id);

	const { isLoader } = useSelector((state: any) => state.richTextDocumentsReducer);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState<RichTextTemplateCategory>("otro");
	const [saving, setSaving] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [contentLoaded, setContentLoaded] = useState(false);
	const printIframeRef = useRef<HTMLIFrameElement | null>(null);

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextStyle,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Placeholder.configure({ placeholder: "Comenzá a escribir el modelo..." }),
			MergeFieldExtension,
			TabIndentExtension,
			FontSizeExtension,
			LineHeightExtension,
			Color,
			Highlight.configure({ multicolor: true }),
			PaginationPlus.configure(A4_CONFIG),
		],
		content: "",
	});

	// Load existing template when editing
	useEffect(() => {
		if (!isEdit || !id || !editor || contentLoaded) return;

		(async () => {
			const result = await dispatch(getRichTextTemplate(id));
			if (!result.success || !result.template) {
				setLoadError("No se pudo cargar el modelo.");
				return;
			}
			const tpl = result.template;
			setName(tpl.name ?? "");
			setDescription(tpl.description ?? "");
			setCategory((tpl.category as RichTextTemplateCategory) ?? "otro");
			if (tpl.content && Object.keys(tpl.content).length > 0) {
				const parsedTpl = editor.schema.nodeFromJSON(tpl.content as Parameters<typeof editor.commands.setContent>[0]);
				editor.view.dispatch(
					editor.state.tr.replaceWith(0, editor.state.doc.content.size, parsedTpl.content).setMeta("addToHistory", false),
				);
			}
			setContentLoaded(true);
		})();
	}, [isEdit, id, editor, dispatch, contentLoaded]);

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
		if (!name.trim()) {
			dispatch(
				openSnackbar({
					open: true,
					message: "El nombre del modelo es requerido.",
					variant: "alert",
					alert: { color: "warning" },
				}),
			);
			return;
		}

		setSaving(true);
		const content = editor.getJSON() as Record<string, unknown>;
		const mergeFields = extractMergeFields(content);
		const payload = { name: name.trim(), description: description.trim(), category, content, mergeFields };

		let result;
		if (isEdit && id) {
			result = await dispatch(updateRichTextTemplate(id, payload));
		} else {
			result = await dispatch(createRichTextTemplate(payload));
		}
		setSaving(false);

		if (result?.success) {
			dispatch(
				openSnackbar({
					open: true,
					message: isEdit ? "Modelo actualizado correctamente." : "Modelo creado correctamente.",
					variant: "alert",
					alert: { color: "success" },
				}),
			);
			navigate("/documentos/modelos?tab=1");
		} else {
			dispatch(
				openSnackbar({
					open: true,
					message: result?.error ?? "Error al guardar el modelo.",
					variant: "alert",
					alert: { color: "error" },
				}),
			);
		}
	};

	if (loadError) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">{loadError}</Alert>
				<Button sx={{ mt: 2 }} onClick={() => navigate("/documentos/modelos?tab=1")}>
					Volver
				</Button>
			</Box>
		);
	}

	return (
		<Stack className="tiptap-root" spacing={2} sx={{ height: "calc(100vh - 80px)" }}>
			{/* Header */}
			<MainCard>
				<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
					{/* Left: back + title fields */}
					<Stack direction="row" alignItems="center" spacing={1.5} flex={1} flexWrap="wrap" gap={1}>
						<Tooltip title="Volver a modelos">
							<IconButton size="small" sx={{ height: 36, width: 36 }} onClick={() => navigate("/documentos/modelos?tab=1")}>
								<ArrowLeft2 size={18} />
							</IconButton>
						</Tooltip>

						<TextField
							size="small"
							placeholder="Nombre del modelo *"
							value={name}
							onChange={(e) => setName(e.target.value)}
							sx={{ minWidth: 240, flex: 1, maxWidth: 360, "& .MuiInputBase-root": { height: 36 } }}
							inputProps={{ maxLength: 120 }}
						/>

						<FormControl size="small" sx={{ minWidth: 140, "& .MuiInputBase-root": { height: 36 } }}>
							<InputLabel>Categoría</InputLabel>
							<Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value as RichTextTemplateCategory)}>
								{CATEGORIES.map((c) => (
									<MenuItem key={c.value} value={c.value}>
										{c.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							size="small"
							placeholder="Descripción (opcional)"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							sx={{ minWidth: 200, flex: 1, maxWidth: 340, "& .MuiInputBase-root": { height: 36 } }}
							inputProps={{ maxLength: 240 }}
						/>
					</Stack>

					{/* Right: status + actions */}
					<Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
						{isEdit && (
							<Chip label={isLoader && !contentLoaded ? "Cargando..." : "Borrador"} size="small" color="default" variant="outlined" />
						)}
						<Button variant="outlined" size="small" sx={{ height: 36 }} onClick={handleExportPdf}>
							Vista previa PDF
						</Button>
						<Button
							variant="contained"
							size="small"
							sx={{ height: 36 }}
							onClick={handleSave}
							disabled={saving}
							startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
						>
							{saving ? "Guardando..." : isEdit ? "Actualizar modelo" : "Guardar modelo"}
						</Button>
					</Stack>
				</Stack>

				{/* Description hint */}
				{!isEdit && (
					<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
						Usá los campos dinámicos del panel derecho para insertar datos que se resolverán al generar un documento.
					</Typography>
				)}
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
				{editor && <EditorToolbar editor={editor} />}

				<Box sx={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
					<Box className="tiptap-scroll" sx={{ flex: 1 }}>
						<EditorContent editor={editor} className="tiptap-editor-content" />
					</Box>

					{editor && (
						<Box
							sx={{
								width: 300,
								flexShrink: 0,
								borderLeft: "1px solid",
								borderColor: "divider",
								display: "flex",
								flexDirection: "column",
								bgcolor: "background.paper",
								overflow: "hidden",
							}}
						>
							<MergeFieldsPanel editor={editor} embedded />
						</Box>
					)}
				</Box>
			</Box>
		</Stack>
	);
};

export default TemplateEditorPage;
